import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchFredSeriesHistory } from "../lib/fetchers/fred";
import {
  RISK_FACTOR_WEIGHTS,
  buildIndexSnapshot,
  buildMomentumFactor,
  buildRiskSummary,
  buildSimpleFactor,
  buildTrendFactor,
  buildYieldCurveFactor,
  calculateWeightedZ,
  getRiskLevel,
  getRiskPosture,
  markFactorStale,
  markIndexStale,
  normalizeWeightedZ,
  type RiskDashboardFactor,
  type RiskDashboardIndex,
  type RiskDashboardSnapshot,
  type RiskDataSourceStatus,
  type RiskFactorId,
} from "../lib/riskDashboard";
import type { FredSeriesPoint } from "../lib/fetchers/fred";

type SeriesKey = "vix" | "credit" | "us10y" | "us2y" | "sp500" | "nasdaq100";

interface SeriesRequest {
  key: SeriesKey;
  label: string;
  series: string;
}

interface RiskHistoryIndexItem {
  date: string;
  path: string;
  riskScore: number;
  weightedZ: number;
  riskLevel: string;
  partial: boolean;
}

interface RiskHistoryIndex {
  schemaVersion: 1;
  updatedAt: string;
  items: RiskHistoryIndexItem[];
}

const rootDir = process.cwd();
const latestPath = path.join(rootDir, "public", "data", "risk-dashboard-latest.json");
const historyDir = path.join(rootDir, "public", "data", "risk-history");
const historyIndexPath = path.join(historyDir, "index.json");
const now = new Date().toISOString();

const requests: SeriesRequest[] = [
  { key: "vix", label: "VIX", series: "VIXCLS" },
  { key: "credit", label: "ICE BofA US High Yield Spread", series: "BAMLH0A0HYM2" },
  { key: "us10y", label: "10Y Treasury Yield", series: "DGS10" },
  { key: "us2y", label: "2Y Treasury Yield", series: "DGS2" },
  { key: "sp500", label: "S&P 500", series: "SP500" },
  { key: "nasdaq100", label: "Nasdaq 100", series: "NASDAQ100" },
];

async function main() {
  const previous = await readJson<RiskDashboardSnapshot | null>(latestPath, null);
  const fredStatus = createStatus("FRED daily historical series");
  const fallbackStatus = createStatus("Local JSON fallback");
  const series = await fetchAllSeries(fredStatus);
  const factors = buildFactors(series, previous, fallbackStatus);
  const indices = buildIndices(series, previous, fallbackStatus);

  if (factors.length !== 5) {
    throw new Error("风险因子数量不足，未写入新快照。");
  }

  const weightedZ = calculateWeightedZ(factors);
  const riskScore = normalizeWeightedZ(weightedZ);
  const riskLevel = getRiskLevel(riskScore);
  const isPartial =
    fredStatus.failed.length > 0 ||
    fallbackStatus.succeeded.length > 0 ||
    factors.some((factor) => factor.stale) ||
    Object.values(indices).some((index) => index.stale);
  const snapshot: RiskDashboardSnapshot = {
    schemaVersion: 1,
    asOf: resolveAsOf(factors, indices),
    generatedAt: now,
    status: {
      isPartial,
      message: isPartial
        ? "部分数据暂未更新，已保留最近一次成功数据。"
        : "所有风险模型数据源已成功更新。",
      sources: finalizeStatuses({
        fred: fredStatus,
        fallback: fallbackStatus,
      }),
    },
    riskScore,
    weightedZ,
    riskLevel,
    posture: getRiskPosture(riskScore),
    factors,
    indices,
    summary: buildRiskSummary({
      riskScore,
      riskLevel,
      factors,
      isPartial,
    }),
    model: {
      formula:
        "RiskZ = 0.25×VIX_z + 0.25×Credit_z + 0.15×YieldCurve_z + 0.15×Trend_z + 0.20×Momentum_z",
      normalization: "RiskScore = clamp(50 + 25 × RiskZ, 0, 100)",
      scoreMapping: "0-20 极度贪婪；20-40 贪婪；40-60 中性；60-80 恐慌；80-100 极度恐慌",
      dataFrequency: "上一交易日收盘数据，每日由 GitHub Actions 自动更新",
    },
  };

  await mkdir(historyDir, { recursive: true });
  await writeJson(latestPath, snapshot);
  await writeJson(path.join(historyDir, `${snapshot.asOf}.json`), snapshot);
  await updateHistoryIndex(snapshot);
  printSourceResults(snapshot.status.sources);
}

async function fetchAllSeries(status: RiskDataSourceStatus) {
  const entries = await Promise.allSettled(
    requests.map(async (request) => ({
      request,
      result: await fetchFredSeriesHistory(request.series),
    })),
  );
  const result: Partial<Record<SeriesKey, FredSeriesPoint[]>> = {};

  entries.forEach((entry, index) => {
    const request = requests[index];

    if (entry.status === "fulfilled") {
      result[request.key] = entry.value.result.observations;
      status.succeeded.push(`${request.label} (${request.series})`);
      return;
    }

    status.failed.push(`${request.label} (${request.series}): ${getErrorMessage(entry.reason)}`);
  });

  return result;
}

function buildFactors(
  series: Partial<Record<SeriesKey, FredSeriesPoint[]>>,
  previous: RiskDashboardSnapshot | null,
  fallbackStatus: RiskDataSourceStatus,
) {
  const factors: RiskDashboardFactor[] = [];

  factors.push(
    buildFactorWithFallback({
      id: "volatility",
      previous,
      fallbackStatus,
      build: () =>
        buildSimpleFactor({
          id: "volatility",
          name: "波动率风险",
          source: "FRED: VIXCLS",
          values: requireSeries(series.vix, "VIX"),
          weight: RISK_FACTOR_WEIGHTS.volatility,
          windowDays: 250,
          unit: "index",
          note: "VIX 越高，市场隐含波动与避险需求越高。",
        }),
    }),
  );
  factors.push(
    buildFactorWithFallback({
      id: "credit",
      previous,
      fallbackStatus,
      build: () =>
        buildSimpleFactor({
          id: "credit",
          name: "信用风险",
          source: "FRED: BAMLH0A0HYM2",
          values: requireSeries(series.credit, "信用利差"),
          weight: RISK_FACTOR_WEIGHTS.credit,
          windowDays: 250,
          unit: "%",
          note: "高收益债利差越宽，信用压力与融资风险越高。",
        }),
    }),
  );
  factors.push(
    buildFactorWithFallback({
      id: "yieldCurve",
      previous,
      fallbackStatus,
      build: () =>
        buildYieldCurveFactor({
          tenYear: requireSeries(series.us10y, "10Y Treasury"),
          twoYear: requireSeries(series.us2y, "2Y Treasury"),
        }),
    }),
  );
  factors.push(
    buildFactorWithFallback({
      id: "trend",
      previous,
      fallbackStatus,
      build: () => buildTrendFactor(requireSeries(series.sp500, "S&P 500")),
    }),
  );
  factors.push(
    buildFactorWithFallback({
      id: "momentum",
      previous,
      fallbackStatus,
      build: () => buildMomentumFactor(requireSeries(series.sp500, "S&P 500")),
    }),
  );

  return factors;
}

function buildFactorWithFallback({
  id,
  previous,
  fallbackStatus,
  build,
}: {
  id: RiskFactorId;
  previous: RiskDashboardSnapshot | null;
  fallbackStatus: RiskDataSourceStatus;
  build: () => RiskDashboardFactor;
}) {
  try {
    return build();
  } catch (error) {
    const fallback = previous?.factors.find((factor) => factor.id === id);

    if (!fallback) {
      throw error;
    }

    fallbackStatus.succeeded.push(`${fallback.name}: 沿用最近一次成功数据`);
    fallbackStatus.failed.push(`${fallback.name}: ${getErrorMessage(error)}`);
    return markFactorStale(fallback);
  }
}

function buildIndices(
  series: Partial<Record<SeriesKey, FredSeriesPoint[]>>,
  previous: RiskDashboardSnapshot | null,
  fallbackStatus: RiskDataSourceStatus,
): RiskDashboardSnapshot["indices"] {
  return {
    sp500: buildIndexWithFallback({
      key: "sp500",
      previous,
      fallbackStatus,
      build: () =>
        buildIndexSnapshot({
          name: "标普500",
          ticker: "SPX",
          source: "FRED: SP500",
          values: requireSeries(series.sp500, "S&P 500"),
        }),
    }),
    nasdaq100: buildIndexWithFallback({
      key: "nasdaq100",
      previous,
      fallbackStatus,
      build: () =>
        buildIndexSnapshot({
          name: "纳斯达克100",
          ticker: "NDX",
          source: "FRED: NASDAQ100",
          values: requireSeries(series.nasdaq100, "Nasdaq 100"),
        }),
    }),
  };
}

function buildIndexWithFallback({
  key,
  previous,
  fallbackStatus,
  build,
}: {
  key: keyof RiskDashboardSnapshot["indices"];
  previous: RiskDashboardSnapshot | null;
  fallbackStatus: RiskDataSourceStatus;
  build: () => RiskDashboardIndex;
}) {
  try {
    return build();
  } catch (error) {
    const fallback = previous?.indices[key];

    if (!fallback) {
      throw error;
    }

    fallbackStatus.succeeded.push(`${fallback.name}: 沿用最近一次成功数据`);
    fallbackStatus.failed.push(`${fallback.name}: ${getErrorMessage(error)}`);
    return markIndexStale(fallback);
  }
}

function requireSeries(series: FredSeriesPoint[] | undefined, label: string) {
  if (!series || series.length === 0) {
    throw new Error(`${label} 没有可用数据`);
  }

  return series;
}

async function updateHistoryIndex(snapshot: RiskDashboardSnapshot) {
  const current = await readJson<RiskHistoryIndex | null>(historyIndexPath, null);
  const item: RiskHistoryIndexItem = {
    date: snapshot.asOf,
    path: `/data/risk-history/${snapshot.asOf}.json`,
    riskScore: snapshot.riskScore,
    weightedZ: snapshot.weightedZ,
    riskLevel: snapshot.riskLevel,
    partial: snapshot.status.isPartial,
  };
  const items = [...(current?.items ?? []).filter((entry) => entry.date !== item.date), item]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-750);

  await writeJson(historyIndexPath, {
    schemaVersion: 1,
    updatedAt: now,
    items,
  });
}

function resolveAsOf(
  factors: RiskDashboardFactor[],
  indices: RiskDashboardSnapshot["indices"],
) {
  return maxDate([
    ...factors.map((factor) => factor.date),
    indices.sp500.date,
    indices.nasdaq100.date,
  ]);
}

function finalizeStatuses(statuses: Record<string, RiskDataSourceStatus>) {
  Object.values(statuses).forEach((status) => {
    status.ok = status.failed.length === 0 && status.succeeded.length > 0;
    status.partial = status.succeeded.length > 0 && status.failed.length > 0;

    if (status.ok) {
      status.message = "更新成功";
    } else if (status.partial) {
      status.message = "部分更新成功";
    } else if (status.failed.length > 0) {
      status.message = "更新失败";
    } else {
      status.message = "本次未触发";
    }
  });

  return statuses;
}

function createStatus(message: string): RiskDataSourceStatus {
  return {
    ok: false,
    partial: false,
    updatedAt: now,
    message,
    succeeded: [],
    failed: [],
  };
}

function printSourceResults(statuses: Record<string, RiskDataSourceStatus>) {
  console.log("Risk dashboard data update finished.");

  Object.entries(statuses).forEach(([source, status]) => {
    const result = status.ok ? "success" : status.partial ? "partial" : "failed";
    console.log(`- ${source}: ${result}`);
    console.log(`  succeeded: ${status.succeeded.join(", ") || "none"}`);
    console.log(`  failed: ${status.failed.join(" | ") || "none"}`);
  });
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function maxDate(dates: string[]) {
  const valid = dates.filter(Boolean);

  if (valid.length === 0) {
    return now.slice(0, 10);
  }

  return valid.sort((a, b) => a.localeCompare(b))[valid.length - 1];
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

main().catch((error) => {
  console.error("Risk dashboard update failed unexpectedly.");
  console.error(error);
  process.exitCode = 1;
});

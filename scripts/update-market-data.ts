import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildDcaAssessment } from "../lib/dcaAssessment";
import { fetchCryptoFearGreed } from "../lib/fetchers/alternative";
import { fetchFredSeries } from "../lib/fetchers/fred";
import { fetchStooqDaily } from "../lib/fetchers/stooq";
import { calculateMarketScore } from "../lib/marketScore";
import type {
  HistoryIndex,
  HistoryIndexItem,
  MarketSnapshot,
  NumericPoint,
  OptionsStructure,
  SentimentPoint,
  SourceKey,
  SourceStatus,
  ValuationData,
} from "../lib/types";

const rootDir = process.cwd();
const latestPath = path.join(rootDir, "public", "data", "market-latest.json");
const historyDir = path.join(rootDir, "public", "data", "history");
const historyIndexPath = path.join(historyDir, "index.json");
const manualDir = path.join(rootDir, "src", "data", "manual");

const now = new Date().toISOString();

async function main() {
  const previous = await readJson<MarketSnapshot | null>(latestPath, null);
  const snapshot = previous ? clone(previous) : createEmptySnapshot();
  const statuses: Record<SourceKey, SourceStatus> = {
    stooq: createStatus("Stooq daily prices"),
    fred: createStatus("FRED daily series"),
    alternative: createStatus("Alternative.me Crypto Fear & Greed"),
    manual: createStatus("Manual JSON inputs"),
  };

  await Promise.all([
    updateStooq(snapshot, statuses.stooq),
    updateFred(snapshot, statuses.fred),
    updateAlternative(snapshot, statuses.alternative),
    updateManual(snapshot, statuses.manual),
  ]);

  finalizeStatuses(statuses);
  snapshot.generatedAt = now;
  snapshot.asOf = resolveAsOf(snapshot);
  snapshot.status = {
    isPartial: Object.values(statuses).some((status) => status.partial || !status.ok),
    message: Object.values(statuses).some((status) => status.partial || !status.ok)
      ? "部分数据暂未更新，已保留最近一次成功数据。"
      : "所有数据源已成功更新。",
    sources: statuses,
  };
  snapshot.score = calculateMarketScore(snapshot);
  snapshot.assessment = buildDcaAssessment(snapshot, snapshot.score);

  await mkdir(historyDir, { recursive: true });
  await writeJson(latestPath, snapshot);
  await writeJson(path.join(historyDir, `${snapshot.asOf}.json`), snapshot);
  await updateHistoryIndex(snapshot);
  printSourceResults(statuses);
}

async function updateStooq(snapshot: MarketSnapshot, status: SourceStatus) {
  const requests = [
    { key: "sp500" as const, label: "S&P 500", symbol: "^SPX" },
    { key: "nasdaq100" as const, label: "Nasdaq 100", symbol: "^NDX" },
  ];

  const results = await Promise.allSettled(
    requests.map(async (request) => ({
      request,
      result: await fetchStooqDaily(request.symbol),
    })),
  );

  results.forEach((result, index) => {
    const request = requests[index];

    if (result.status === "fulfilled") {
      const currentPoint = snapshot.indices[request.key];
      const fallbackPrevious =
        currentPoint.date !== result.value.result.latest.date &&
        isNearbyTradingSnapshot(currentPoint.date, result.value.result.latest.date)
          ? currentPoint.value
          : null;
      snapshot.indices[request.key] = pointFromStooq(
        request.label,
        result.value.result.latest.close,
        result.value.result.previous?.close ?? fallbackPrevious,
        result.value.result.latest.date,
      );
      status.succeeded.push(request.label);
      return;
    }

    snapshot.indices[request.key] = markStale(snapshot.indices[request.key]);
    status.failed.push(`${request.label}: ${getErrorMessage(result.reason)}`);
  });
}

async function updateFred(snapshot: MarketSnapshot, status: SourceStatus) {
  const requests = [
    { target: "volatility" as const, key: "vix" as const, label: "VIX", series: "VIXCLS" },
    { target: "volatility" as const, key: "vxn" as const, label: "VXN", series: "VXNCLS" },
    { target: "rates" as const, key: "us10y" as const, label: "10Y Treasury", series: "DGS10" },
    { target: "rates" as const, key: "us2y" as const, label: "2Y Treasury", series: "DGS2" },
  ];

  const results = await Promise.allSettled(
    requests.map(async (request) => ({
      request,
      result: await fetchFredSeries(request.series),
    })),
  );

  results.forEach((result, index) => {
    const request = requests[index];

    if (result.status === "fulfilled") {
      const point = pointFromObservation(
        request.label,
        result.value.result.latest.value,
        result.value.result.previous?.value ?? null,
        result.value.result.latest.date,
        request.target === "rates" ? "%" : undefined,
      );

      if (request.target === "volatility") {
        snapshot.volatility[request.key] = point;
      } else {
        snapshot.rates[request.key] = point;
      }

      status.succeeded.push(request.label);
      return;
    }

    if (request.target === "volatility") {
      snapshot.volatility[request.key] = markStale(snapshot.volatility[request.key]);
    } else {
      snapshot.rates[request.key] = markStale(snapshot.rates[request.key]);
    }

    status.failed.push(`${request.label}: ${getErrorMessage(result.reason)}`);
  });

  snapshot.rates.yieldCurve2s10s = buildYieldCurvePoint(
    snapshot.rates.us10y,
    snapshot.rates.us2y,
  );
}

async function updateAlternative(snapshot: MarketSnapshot, status: SourceStatus) {
  try {
    const result = await fetchCryptoFearGreed();
    snapshot.sentiment.cryptoFearGreed = {
      value: result.value,
      previous: snapshot.sentiment.cryptoFearGreed.value,
      change:
        typeof snapshot.sentiment.cryptoFearGreed.value === "number"
          ? round(result.value - snapshot.sentiment.cryptoFearGreed.value, 2)
          : null,
      changePercent: null,
      date: result.date,
      source: result.source,
      classification: result.classification,
      stale: false,
    };
    status.succeeded.push("Crypto Fear & Greed");
  } catch (error) {
    snapshot.sentiment.cryptoFearGreed = markStale(
      snapshot.sentiment.cryptoFearGreed,
    ) as SentimentPoint;
    status.failed.push(`Crypto Fear & Greed: ${getErrorMessage(error)}`);
  }
}

async function updateManual(snapshot: MarketSnapshot, status: SourceStatus) {
  await Promise.all([
    readJson<SentimentPoint | null>(
      path.join(manualDir, "cnn-fear-greed.json"),
      null,
    )
      .then((manual) => {
        if (!manual || typeof manual.value !== "number") {
          throw new Error("cnn-fear-greed.json is missing a numeric value");
        }

        snapshot.sentiment.cnnFearGreed = {
          ...manual,
          source: "manual",
          stale: false,
        };
        status.succeeded.push("CNN Fear & Greed");
      })
      .catch((error) => {
        snapshot.sentiment.cnnFearGreed = markStale(
          snapshot.sentiment.cnnFearGreed,
        ) as SentimentPoint;
        status.failed.push(`CNN Fear & Greed: ${getErrorMessage(error)}`);
      }),
    readJson<ValuationData | null>(path.join(manualDir, "valuation.json"), null)
      .then((manual) => {
        if (!manual || typeof manual.sp500PE?.value !== "number") {
          throw new Error("valuation.json is missing S&P 500 P/E");
        }

        snapshot.valuation = {
          ...manual,
          source: "manual",
          sp500PE: { ...manual.sp500PE, source: "manual", stale: false },
          cape: { ...manual.cape, source: "manual", stale: false },
        };
        status.succeeded.push("Valuation");
      })
      .catch((error) => {
        snapshot.valuation = {
          ...snapshot.valuation,
          sp500PE: markStale(snapshot.valuation.sp500PE),
          cape: markStale(snapshot.valuation.cape),
        };
        status.failed.push(`Valuation: ${getErrorMessage(error)}`);
      }),
    readJson<OptionsStructure | null>(
      path.join(manualDir, "options-structure.json"),
      null,
    )
      .then((manual) => {
        if (!manual || !manual.spxNetGamma?.label) {
          throw new Error("options-structure.json is missing SPX Net Gamma");
        }

        snapshot.optionsStructure = {
          ...manual,
          source: "manual",
          spxZeroGamma: { ...manual.spxZeroGamma, source: "manual", stale: false },
          spxPutWall: { ...manual.spxPutWall, source: "manual", stale: false },
          spxCallWall: { ...manual.spxCallWall, source: "manual", stale: false },
        };
        status.succeeded.push("Options Structure");
      })
      .catch((error) => {
        snapshot.optionsStructure = {
          ...snapshot.optionsStructure,
          spxZeroGamma: markStale(snapshot.optionsStructure.spxZeroGamma),
          spxPutWall: markStale(snapshot.optionsStructure.spxPutWall),
          spxCallWall: markStale(snapshot.optionsStructure.spxCallWall),
        };
        status.failed.push(`Options Structure: ${getErrorMessage(error)}`);
      }),
  ]);
}

async function updateHistoryIndex(snapshot: MarketSnapshot) {
  const current = await readJson<HistoryIndex | null>(historyIndexPath, null);
  const item: HistoryIndexItem = {
    date: snapshot.asOf,
    path: `/data/history/${snapshot.asOf}.json`,
    score: snapshot.score.value,
    sp500: snapshot.indices.sp500.value,
    nasdaq100: snapshot.indices.nasdaq100.value,
    vix: snapshot.volatility.vix.value,
    cryptoFearGreed: snapshot.sentiment.cryptoFearGreed.value,
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

function pointFromStooq(
  source: string,
  value: number,
  previous: number | null,
  date: string,
): NumericPoint {
  const change = previous === null ? null : round(value - previous, 4);
  const changePercent =
    previous === null || previous === 0 ? null : round(((value - previous) / previous) * 100, 2);

  return {
    value: round(value, 4),
    previous,
    change,
    changePercent,
    date,
    source,
    stale: false,
  };
}

function pointFromObservation(
  source: string,
  value: number,
  previous: number | null,
  date: string,
  unit?: string,
): NumericPoint {
  return {
    value: round(value, 4),
    previous,
    change: previous === null ? null : round(value - previous, 4),
    changePercent: previous === null || previous === 0 ? null : round(((value - previous) / previous) * 100, 2),
    date,
    source,
    unit,
    stale: false,
  };
}

function buildYieldCurvePoint(us10y: NumericPoint, us2y: NumericPoint): NumericPoint {
  const value =
    typeof us10y.value === "number" && typeof us2y.value === "number"
      ? round((us10y.value - us2y.value) * 100, 2)
      : null;
  const previous =
    typeof us10y.previous === "number" && typeof us2y.previous === "number"
      ? round((us10y.previous - us2y.previous) * 100, 2)
      : null;

  return {
    value,
    previous,
    change:
      typeof value === "number" && typeof previous === "number"
        ? round(value - previous, 2)
        : null,
    changePercent: null,
    date: maxDate([us10y.date, us2y.date]) ?? us10y.date,
    source: "FRED",
    unit: "bp",
    stale: Boolean(us10y.stale || us2y.stale),
  };
}

function markStale<T extends NumericPoint>(point: T): T {
  return {
    ...point,
    stale: true,
  };
}

function finalizeStatuses(statuses: Record<SourceKey, SourceStatus>) {
  Object.values(statuses).forEach((status) => {
    status.ok = status.failed.length === 0 && status.succeeded.length > 0;
    status.partial = status.succeeded.length > 0 && status.failed.length > 0;
    if (status.ok) {
      status.message = "更新成功";
    } else if (status.partial) {
      status.message = "部分更新成功，失败项沿用旧值";
    } else {
      status.message = "更新失败，全部沿用旧值";
    }
  });
}

function resolveAsOf(snapshot: MarketSnapshot) {
  return (
    maxDate([snapshot.indices.sp500.date, snapshot.indices.nasdaq100.date]) ??
    maxDate([
      snapshot.volatility.vix.date,
      snapshot.volatility.vxn.date,
      snapshot.rates.us10y.date,
      snapshot.rates.us2y.date,
    ]) ??
    now.slice(0, 10)
  );
}

function maxDate(dates: Array<string | undefined | null>) {
  const valid = dates.filter((date): date is string => Boolean(date));

  if (valid.length === 0) {
    return null;
  }

  return valid.sort((a, b) => a.localeCompare(b))[valid.length - 1];
}

function isNearbyTradingSnapshot(previousDate: string, nextDate: string) {
  const previous = Date.parse(`${previousDate}T00:00:00Z`);
  const next = Date.parse(`${nextDate}T00:00:00Z`);

  if (!Number.isFinite(previous) || !Number.isFinite(next) || next <= previous) {
    return false;
  }

  const days = (next - previous) / 86_400_000;
  return days <= 7;
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

function createStatus(message: string): SourceStatus {
  return {
    ok: false,
    partial: false,
    updatedAt: now,
    message,
    succeeded: [],
    failed: [],
  };
}

function createEmptySnapshot(): MarketSnapshot {
  const date = now.slice(0, 10);
  const empty = (source: string, unit?: string): NumericPoint => ({
    value: null,
    previous: null,
    change: null,
    changePercent: null,
    date,
    source,
    unit,
    stale: true,
  });

  return {
    schemaVersion: 1,
    asOf: date,
    generatedAt: now,
    status: {
      isPartial: true,
      message: "等待首次更新。",
      sources: {
        stooq: createStatus("等待首次更新"),
        fred: createStatus("等待首次更新"),
        alternative: createStatus("等待首次更新"),
        manual: createStatus("等待首次更新"),
      },
    },
    indices: {
      sp500: empty("S&P 500"),
      nasdaq100: empty("Nasdaq 100"),
    },
    volatility: {
      vix: empty("VIX"),
      vxn: empty("VXN"),
    },
    rates: {
      us10y: empty("DGS10", "%"),
      us2y: empty("DGS2", "%"),
      yieldCurve2s10s: empty("2Y/10Y", "bp"),
    },
    sentiment: {
      cnnFearGreed: { ...empty("manual"), classification: "N/A" },
      cryptoFearGreed: { ...empty("Alternative.me"), classification: "N/A" },
    },
    valuation: {
      sp500PE: empty("manual"),
      cape: empty("manual"),
      summary: "等待手动估值数据。",
      date,
      source: "manual",
    },
    optionsStructure: {
      date,
      source: "manual",
      spxNetGamma: {
        status: "neutral",
        label: "N/A",
        description: "等待手动期权结构数据。",
      },
      spxZeroGamma: empty("manual"),
      spxPutWall: empty("manual"),
      spxCallWall: empty("manual"),
      ndxQqqPutWall: "N/A",
      ndxQqqCallWall: "N/A",
      interpretation: "等待手动期权结构数据。",
    },
    score: {
      value: 50,
      label: "数据不足",
      level: "neutral",
      drivers: [],
    },
    assessment: {
      title: "今日数据评估",
      summary: "等待首次成功更新。",
      bullets: [],
      action: "等待自动更新。",
      riskLevel: "数据不足",
    },
  };
}

function printSourceResults(statuses: Record<SourceKey, SourceStatus>) {
  console.log("Market data update finished.");
  Object.entries(statuses).forEach(([source, status]) => {
    const result = status.ok ? "success" : status.partial ? "partial" : "failed";
    console.log(`- ${source}: ${result}`);
    console.log(`  succeeded: ${status.succeeded.join(", ") || "none"}`);
    console.log(`  failed: ${status.failed.join(" | ") || "none"}`);
  });
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

main().catch((error) => {
  console.error("Market data update failed unexpectedly.");
  console.error(error);
  process.exitCode = 1;
});

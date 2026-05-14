import type { FredSeriesPoint } from "./fetchers/fred";

export type RiskLevel =
  | "极度贪婪"
  | "贪婪"
  | "中性"
  | "恐慌"
  | "高恐慌"
  | "极度恐慌"
  | "危机级恐慌";

export type RiskFactorId =
  | "volatility"
  | "credit"
  | "yieldCurve"
  | "trend"
  | "momentum";

export type RiskFactorLevel = "低风险" | "中性" | "高风险" | "极高风险";

export type RiskTrend = "up" | "down" | "flat";

export interface RiskDataSourceStatus {
  ok: boolean;
  partial: boolean;
  updatedAt: string;
  message: string;
  succeeded: string[];
  failed: string[];
}

export interface RiskDashboardFactor {
  id: RiskFactorId;
  name: string;
  source: string;
  rawDisplay: string;
  rawValue: number;
  rawStdDev: number;
  benchmarkDisplay: string;
  benchmarkValue: number;
  benchmarkLabel: string;
  riskValue: number;
  riskBenchmarkValue: number;
  riskStdDev: number;
  zScore: number;
  rawZScore: number;
  clippedZScore: number;
  weight: number;
  contribution: number;
  riskLevel: RiskFactorLevel;
  progress: number;
  trend: RiskTrend;
  window: string;
  windowDays: number;
  note: string;
  manualLabel: string;
  manualUnit: string;
  manualStep: number;
  date: string;
  stale: boolean;
}

export interface RiskDashboardIndex {
  name: string;
  ticker: string;
  levelDisplay: string;
  level: number;
  previous: number | null;
  change: number | null;
  changePercent: number | null;
  distanceDisplay: string;
  distanceTo200Ma: number | null;
  note: string;
  source: string;
  date: string;
  stale: boolean;
}

export interface RiskDashboardSnapshot {
  schemaVersion: 1;
  asOf: string;
  generatedAt: string;
  status: {
    isPartial: boolean;
    message: string;
    sources: Record<string, RiskDataSourceStatus>;
  };
  riskScore: number;
  weightedZ: number;
  rawWeightedZ?: number;
  crisisFlag?: boolean;
  crisisReason?: string;
  riskLevel: RiskLevel;
  posture: string;
  factors: RiskDashboardFactor[];
  indices: {
    sp500: RiskDashboardIndex;
    nasdaq100: RiskDashboardIndex;
  };
  summary: string;
  model: {
    formula: string;
    normalization: string;
    scoreMapping: string;
    dataFrequency: string;
  };
}

export const RISK_MODEL_VERSION = "rolling-z-v1";

export const RISK_FACTOR_WEIGHTS: Record<RiskFactorId, number> = {
  volatility: 0.25,
  credit: 0.25,
  yieldCurve: 0.15,
  trend: 0.15,
  momentum: 0.2,
};

export interface WeightedRiskInput {
  id?: RiskFactorId;
  weight: number;
  zScore: number;
  rawZScore?: number;
  clippedZScore?: number;
  rawValue?: number;
}

export function buildSimpleFactor({
  id,
  name,
  source,
  values,
  weight,
  windowDays,
  unit,
  note,
}: {
  id: RiskFactorId;
  name: string;
  source: string;
  values: FredSeriesPoint[];
  weight: number;
  windowDays: number;
  unit?: "%" | "index";
  note: string;
}): RiskDashboardFactor {
  const clean = cleanSeries(values);
  requireLength(clean, windowDays + 1, name);

  const latest = clean[clean.length - 1];
  const previous = clean[clean.length - 2];
  const windowValues = clean.slice(-windowDays).map((point) => point.value);
  const stats = rollingStats(windowValues);
  const zScore = normalizeRiskDirection(
    calculateRollingZ(latest.value, windowValues),
    "keep",
  );

  return buildFactor({
    id,
    name,
    source,
    rawValue: latest.value,
    rawDisplay: formatValue(latest.value, unit),
    benchmarkValue: stats.mean,
    benchmarkDisplay: formatValue(stats.mean, unit),
    benchmarkLabel: `${windowDays}日均值`,
    rawStdDev: stats.std,
    riskBenchmarkValue: stats.mean,
    riskStdDev: stats.std,
    zScore,
    weight,
    previousRiskValue: previous.value,
    currentRiskValue: latest.value,
    windowDays,
    note,
    date: latest.date,
    stale: false,
  });
}

export function buildYieldCurveFactor({
  tenYear,
  twoYear,
}: {
  tenYear: FredSeriesPoint[];
  twoYear: FredSeriesPoint[];
}): RiskDashboardFactor {
  const spreadSeries = alignByDate(tenYear, twoYear).map((point) => ({
    date: point.date,
    rawValue: round((point.a - point.b) * 100, 2),
    riskValue: round((point.b - point.a) * 100, 2),
  }));
  const windowDays = 250;
  requireLength(spreadSeries, windowDays + 1, "收益率曲线风险");

  const latest = spreadSeries[spreadSeries.length - 1];
  const previous = spreadSeries[spreadSeries.length - 2];
  const rawWindow = spreadSeries.slice(-windowDays).map((point) => point.rawValue);
  const riskWindow = spreadSeries.slice(-windowDays).map((point) => point.riskValue);
  const rawStats = rollingStats(rawWindow);
  const riskStats = rollingStats(riskWindow);
  const zScore = normalizeRiskDirection(
    calculateRollingZ(latest.rawValue, rawWindow),
    "invert",
  );

  return buildFactor({
    id: "yieldCurve",
    name: "收益率曲线风险",
    source: "FRED: DGS10 - DGS2",
    rawValue: latest.rawValue,
    rawDisplay: formatCurveSpread(latest.rawValue),
    benchmarkValue: rawStats.mean,
    benchmarkDisplay: formatCurveSpread(rawStats.mean),
    benchmarkLabel: `${windowDays}日均值`,
    rawStdDev: rawStats.std,
    riskBenchmarkValue: riskStats.mean,
    riskStdDev: riskStats.std,
    zScore,
    weight: RISK_FACTOR_WEIGHTS.yieldCurve,
    previousRiskValue: previous.riskValue,
    currentRiskValue: latest.riskValue,
    windowDays,
    note: "10Y-2Y 利差越低、倒挂越深，周期压力越高。",
    date: latest.date,
    stale: false,
  });
}

export function buildTrendFactor(sp500: FredSeriesPoint[]): RiskDashboardFactor {
  const windowDays = 120;
  const clean = cleanSeries(sp500);
  const trendSeries = clean
    .map((point, index) => {
      if (index < 199) {
        return null;
      }

      const sma200 = average(clean.slice(index - 199, index + 1).map((item) => item.value));
      const distance = ((point.value - sma200) / sma200) * 100;

      return {
        date: point.date,
        rawValue: round(distance, 2),
        riskValue: round(-distance, 2),
      };
    })
    .filter((point): point is { date: string; rawValue: number; riskValue: number } =>
      Boolean(point),
    );

  requireLength(trendSeries, windowDays + 1, "趋势风险");

  const latest = trendSeries[trendSeries.length - 1];
  const previous = trendSeries[trendSeries.length - 2];
  const rawWindow = trendSeries.slice(-windowDays).map((point) => point.rawValue);
  const riskWindow = trendSeries.slice(-windowDays).map((point) => point.riskValue);
  const rawStats = rollingStats(rawWindow);
  const riskStats = rollingStats(riskWindow);
  const zScore = normalizeRiskDirection(
    calculateRollingZ(latest.rawValue, rawWindow),
    "invert",
  );

  return buildFactor({
    id: "trend",
    name: "趋势风险",
    source: "FRED: SP500 相对 200日均线",
    rawValue: latest.rawValue,
    rawDisplay: formatSignedPercent(latest.rawValue),
    benchmarkValue: rawStats.mean,
    benchmarkDisplay: formatSignedPercent(rawStats.mean),
    benchmarkLabel: `${windowDays}日均值`,
    rawStdDev: rawStats.std,
    riskBenchmarkValue: riskStats.mean,
    riskStdDev: riskStats.std,
    zScore,
    weight: RISK_FACTOR_WEIGHTS.trend,
    previousRiskValue: previous.riskValue,
    currentRiskValue: latest.riskValue,
    windowDays,
    note: "指数跌破 200日均线越多，趋势风险越高。",
    date: latest.date,
    stale: false,
  });
}

export function buildMomentumFactor(sp500: FredSeriesPoint[]): RiskDashboardFactor {
  const windowDays = 120;
  const clean = cleanSeries(sp500);
  const momentumSeries = clean
    .map((point, index) => {
      if (index < 69) {
        return null;
      }

      const currentSma50 = average(clean.slice(index - 49, index + 1).map((item) => item.value));
      const priorSma50 = average(clean.slice(index - 69, index - 19).map((item) => item.value));
      const slope = ((currentSma50 - priorSma50) / priorSma50) * 100;

      return {
        date: point.date,
        rawValue: round(slope, 2),
        riskValue: round(-slope, 2),
      };
    })
    .filter((point): point is { date: string; rawValue: number; riskValue: number } =>
      Boolean(point),
    );

  requireLength(momentumSeries, windowDays + 1, "动能风险");

  const latest = momentumSeries[momentumSeries.length - 1];
  const previous = momentumSeries[momentumSeries.length - 2];
  const rawWindow = momentumSeries.slice(-windowDays).map((point) => point.rawValue);
  const riskWindow = momentumSeries.slice(-windowDays).map((point) => point.riskValue);
  const rawStats = rollingStats(rawWindow);
  const riskStats = rollingStats(riskWindow);
  const zScore = normalizeRiskDirection(
    calculateRollingZ(latest.rawValue, rawWindow),
    "invert",
  );

  return buildFactor({
    id: "momentum",
    name: "动能风险",
    source: "FRED: SP500 50日均线斜率",
    rawValue: latest.rawValue,
    rawDisplay: formatSignedPercent(latest.rawValue),
    benchmarkValue: rawStats.mean,
    benchmarkDisplay: formatSignedPercent(rawStats.mean),
    benchmarkLabel: `${windowDays}日均值`,
    rawStdDev: rawStats.std,
    riskBenchmarkValue: riskStats.mean,
    riskStdDev: riskStats.std,
    zScore,
    weight: RISK_FACTOR_WEIGHTS.momentum,
    previousRiskValue: previous.riskValue,
    currentRiskValue: latest.riskValue,
    windowDays,
    note: "50日均线斜率越弱，市场动能风险越高。",
    date: latest.date,
    stale: false,
  });
}

export function buildIndexSnapshot({
  name,
  ticker,
  source,
  values,
}: {
  name: string;
  ticker: string;
  source: string;
  values: FredSeriesPoint[];
}): RiskDashboardIndex {
  const clean = cleanSeries(values);
  requireLength(clean, 201, name);

  const latest = clean[clean.length - 1];
  const previous = clean[clean.length - 2] ?? null;
  const sma200 = average(clean.slice(-200).map((point) => point.value));
  const distance = ((latest.value - sma200) / sma200) * 100;
  const change = previous ? latest.value - previous.value : null;
  const changePercent = previous ? ((latest.value - previous.value) / previous.value) * 100 : null;

  return {
    name,
    ticker,
    levelDisplay: formatIndexLevel(latest.value),
    level: round(latest.value, 2),
    previous: previous ? round(previous.value, 2) : null,
    change: change === null ? null : round(change, 2),
    changePercent: changePercent === null ? null : round(changePercent, 2),
    distanceDisplay: formatSignedPercent(distance),
    distanceTo200Ma: round(distance, 2),
    note: distance >= 0 ? "位于 200日均线上方" : "低于 200日均线",
    source,
    date: latest.date,
    stale: false,
  };
}

export function calculateRollingZ(currentValue: number, rollingValues: number[]) {
  const stats = rollingStats(rollingValues);

  return safeZ(currentValue, stats.mean, stats.std);
}

export function normalizeRiskDirection(
  zScore: number,
  direction: "keep" | "invert",
) {
  return direction === "invert" ? -zScore : zScore;
}

export function clipZScore(zScore: number) {
  return clamp(zScore, -3, 3);
}

export function calculateWeightedRiskZ(factors: ReadonlyArray<WeightedRiskInput>) {
  return round(
    factors.reduce(
      (total, factor) =>
        total + factor.weight * (factor.clippedZScore ?? clipZScore(factor.zScore)),
      0,
    ),
    4,
  );
}

export function calculateWeightedZ(factors: ReadonlyArray<WeightedRiskInput>) {
  return calculateWeightedRiskZ(factors);
}

export function calculateRawWeightedRiskZ(factors: ReadonlyArray<WeightedRiskInput>) {
  return round(
    factors.reduce(
      (total, factor) => total + factor.weight * (factor.rawZScore ?? factor.zScore),
      0,
    ),
    4,
  );
}

export interface CrisisStatus {
  crisisFlag: boolean;
  crisisReason: string;
}

export function detectCrisisFlag({
  rawWeightedRiskZ,
  factors,
  vix,
}: {
  rawWeightedRiskZ?: number;
  factors: ReadonlyArray<WeightedRiskInput>;
  vix?: number;
}) {
  return getCrisisStatus({ rawWeightedRiskZ, factors, vix }).crisisFlag;
}

export function getCrisisStatus({
  rawWeightedRiskZ,
  factors,
  vix,
}: {
  rawWeightedRiskZ?: number;
  factors: ReadonlyArray<WeightedRiskInput>;
  vix?: number;
}): CrisisStatus {
  const rawZById = new Map(
    factors
      .filter((factor) => factor.id)
      .map((factor) => [
        factor.id as RiskFactorId,
        factor.rawZScore ?? factor.zScore,
      ]),
  );
  const rawFactors = factors.map((factor) => factor.rawZScore ?? factor.zScore);
  const highRawFactorCount = rawFactors.filter((zScore) => zScore >= 2.7).length;
  const volatilityValue =
    vix ??
    factors.find((factor) => factor.id === "volatility")?.rawValue ??
    Number.NEGATIVE_INFINITY;
  const creditZ = rawZById.get("credit") ?? Number.NEGATIVE_INFINITY;
  const trendZ = rawZById.get("trend") ?? Number.NEGATIVE_INFINITY;
  const momentumZ = rawZById.get("momentum") ?? Number.NEGATIVE_INFINITY;

  if (volatilityValue >= 60) {
    return {
      crisisFlag: true,
      crisisReason: "VIX >= 60",
    };
  }

  if (
    volatilityValue >= 50 &&
    creditZ >= 2.5 &&
    trendZ >= 2 &&
    momentumZ >= 2
  ) {
    return {
      crisisFlag: true,
      crisisReason: "VIX >= 50 且信用、趋势、动能风险同步极端",
    };
  }

  if (highRawFactorCount >= 4) {
    return {
      crisisFlag: true,
      crisisReason: "至少四个原始风险因子 Z 值 >= 2.7",
    };
  }

  return {
    crisisFlag: false,
    crisisReason:
      rawWeightedRiskZ === undefined
        ? "未触发危机级条件"
        : `未触发危机级条件，rawWeightedRiskZ=${round(rawWeightedRiskZ, 2)}`,
  };
}

export function convertWeightedZToRiskScore(
  weightedRiskZ: number,
  crisisFlag = false,
) {
  if (crisisFlag) {
    return 100;
  }

  const rawScore = 50 + 50 * Math.tanh(weightedRiskZ / 2);

  return Math.min(99, Math.max(1, Math.round(rawScore)));
}

export function normalizeWeightedZ(value: number) {
  return convertWeightedZToRiskScore(value, false);
}

export function getMarketState(score: number): RiskLevel {
  if (score < 20) {
    return "极度贪婪";
  }

  if (score < 40) {
    return "贪婪";
  }

  if (score < 60) {
    return "中性";
  }

  if (score < 75) {
    return "恐慌";
  }

  if (score < 90) {
    return "高恐慌";
  }

  if (score < 97) {
    return "极度恐慌";
  }

  return "危机级恐慌";
}

export function getRiskLevel(score: number): RiskLevel {
  return getMarketState(score);
}

export function getDcaMultiplier(score: number) {
  if (score < 20) {
    return 0.3;
  }

  if (score < 40) {
    return 0.6;
  }

  if (score < 60) {
    return 1;
  }

  if (score < 75) {
    return 1.4;
  }

  if (score < 90) {
    return 1.8;
  }

  if (score < 97) {
    return 2.5;
  }

  return 3;
}

export function getRiskPosture(score: number) {
  if (score < 20) {
    return "极度进攻";
  }

  if (score < 40) {
    return "偏进攻";
  }

  if (score < 60) {
    return "均衡";
  }

  if (score < 75) {
    return "偏防御";
  }

  if (score < 90) {
    return "高防御";
  }

  if (score < 97) {
    return "高度防御";
  }

  return "危机防御";
}

export function buildRiskSummary({
  riskScore,
  riskLevel,
  factors,
  isPartial,
}: {
  riskScore: number;
  riskLevel: RiskLevel;
  factors: RiskDashboardFactor[];
  isPartial: boolean;
}) {
  const topDrivers = [...factors]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3)
    .map((factor) => factor.name.replace("风险", ""));
  const partialText = isPartial ? "部分数据源暂未更新，系统已沿用最近一次成功数据。" : "";

  return `${partialText}当前市场温度为 ${riskScore}/100，处于${riskLevel}区间。主要风险贡献来自${topDrivers.join("、")}。该模型面向长期指数配置和逆向定投参考，强调分批执行、现金流稳定与风险纪律，不构成短线交易信号。`;
}

export function markFactorStale(factor: RiskDashboardFactor): RiskDashboardFactor {
  return {
    ...factor,
    stale: true,
  };
}

export function markIndexStale(index: RiskDashboardIndex): RiskDashboardIndex {
  return {
    ...index,
    stale: true,
  };
}

export function formatSigned(value: number, digits = 2) {
  const rounded = round(value, digits);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(digits)}`;
}

function buildFactor({
  id,
  name,
  source,
  rawValue,
  rawDisplay,
  rawStdDev,
  benchmarkValue,
  benchmarkDisplay,
  benchmarkLabel,
  riskBenchmarkValue,
  riskStdDev,
  zScore,
  weight,
  previousRiskValue,
  currentRiskValue,
  windowDays,
  note,
  date,
  stale,
}: {
  id: RiskFactorId;
  name: string;
  source: string;
  rawValue: number;
  rawDisplay: string;
  rawStdDev: number;
  benchmarkValue: number;
  benchmarkDisplay: string;
  benchmarkLabel: string;
  riskBenchmarkValue: number;
  riskStdDev: number;
  zScore: number;
  weight: number;
  previousRiskValue: number;
  currentRiskValue: number;
  windowDays: number;
  note: string;
  date: string;
  stale: boolean;
}): RiskDashboardFactor {
  const clippedZScore = clipZScore(zScore);
  const factorScore = convertWeightedZToRiskScore(clippedZScore, false);

  return {
    id,
    name,
    source,
    rawValue: round(rawValue, 4),
    rawDisplay,
    rawStdDev: round(rawStdDev, 4),
    benchmarkValue: round(benchmarkValue, 4),
    benchmarkDisplay,
    benchmarkLabel,
    riskValue: round(currentRiskValue, 4),
    riskBenchmarkValue: round(riskBenchmarkValue, 4),
    riskStdDev: round(riskStdDev, 4),
    rawZScore: round(zScore, 2),
    clippedZScore: round(clippedZScore, 2),
    zScore: round(clippedZScore, 2),
    weight,
    contribution: round(weight * clippedZScore, 2),
    riskLevel: getFactorLevel(factorScore),
    progress: factorScore,
    trend: getTrend(previousRiskValue, currentRiskValue),
    window: `${windowDays} 个交易日`,
    windowDays,
    note,
    ...getManualMeta(id),
    date,
    stale,
  };
}

function getManualMeta(id: RiskFactorId) {
  if (id === "volatility") {
    return {
      manualLabel: "VIX",
      manualUnit: "",
      manualStep: 0.01,
    };
  }

  if (id === "credit") {
    return {
      manualLabel: "高收益债利差",
      manualUnit: "%",
      manualStep: 0.01,
    };
  }

  if (id === "yieldCurve") {
    return {
      manualLabel: "10Y - 2Y 利差",
      manualUnit: "bp",
      manualStep: 1,
    };
  }

  if (id === "trend") {
    return {
      manualLabel: "SPX 相对 200MA",
      manualUnit: "%",
      manualStep: 0.01,
    };
  }

  return {
    manualLabel: "50MA 斜率",
    manualUnit: "%",
    manualStep: 0.01,
  };
}

function getFactorLevel(score: number): RiskFactorLevel {
  if (score < 40) {
    return "低风险";
  }

  if (score < 60) {
    return "中性";
  }

  if (score < 80) {
    return "高风险";
  }

  return "极高风险";
}

function getTrend(previous: number, current: number): RiskTrend {
  const delta = current - previous;

  if (Math.abs(delta) < 0.0001) {
    return "flat";
  }

  return delta > 0 ? "up" : "down";
}

function alignByDate(a: FredSeriesPoint[], b: FredSeriesPoint[]) {
  const bByDate = new Map(cleanSeries(b).map((point) => [point.date, point.value]));

  return cleanSeries(a)
    .map((point) => {
      const bValue = bByDate.get(point.date);

      if (typeof bValue !== "number") {
        return null;
      }

      return {
        date: point.date,
        a: point.value,
        b: bValue,
      };
    })
    .filter((point): point is { date: string; a: number; b: number } => Boolean(point));
}

function cleanSeries(values: FredSeriesPoint[]) {
  return values
    .filter((point) => point.date && Number.isFinite(point.value) && point.value > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function requireLength(values: unknown[], length: number, label: string) {
  if (values.length < length) {
    throw new Error(`${label} 可用历史数据不足，需要至少 ${length} 条，当前 ${values.length} 条`);
  }
}

function rollingStats(values: number[]) {
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));

  return {
    mean,
    std: Math.sqrt(variance),
  };
}

function safeZ(value: number, mean: number, std: number) {
  if (!Number.isFinite(std) || std === 0) {
    return 0;
  }

  return (value - mean) / std;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatValue(value: number, unit?: "%" | "index") {
  if (unit === "%") {
    return `${round(value, 2).toFixed(2)}%`;
  }

  if (unit === "index") {
    return round(value, 2).toFixed(2);
  }

  return round(value, 2).toFixed(2);
}

function formatCurveSpread(value: number) {
  const rounded = Math.round(value);

  if (rounded < 0) {
    return `倒挂 ${Math.abs(rounded)} bp`;
  }

  return `+${rounded} bp`;
}

function formatSignedPercent(value: number) {
  return `${formatSigned(value, 2)}%`;
}

function formatIndexLevel(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

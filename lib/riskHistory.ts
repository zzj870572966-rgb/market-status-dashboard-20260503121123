import type { FredSeriesPoint } from "./fetchers/fred";
import {
  RISK_FACTOR_WEIGHTS,
  calculateRollingZ,
  calculateWeightedRiskZ,
  clipZScore,
  convertWeightedZToRiskScore,
  detectCrisisFlag,
  getDcaMultiplier,
  getMarketState,
  type RiskLevel,
} from "./riskDashboard";

export interface DailyRiskRecord {
  date: string;
  riskScore: number;
  weightedZ: number;
  sentiment: RiskLevel;
  spxChange: number;
  ndxChange: number;
  vix: number;
  dcaMultiplier: number;
  source: "FRED";
}

export interface RealRiskHistory {
  schemaVersion: 1;
  generatedAt: string;
  source: "FRED daily historical series";
  startDate: string;
  endDate: string;
  records: DailyRiskRecord[];
}

export interface RiskHistorySeries {
  vix: FredSeriesPoint[];
  credit: FredSeriesPoint[];
  us10y: FredSeriesPoint[];
  us2y: FredSeriesPoint[];
  sp500: FredSeriesPoint[];
  nasdaq100: FredSeriesPoint[];
}

interface DerivedPoint {
  date: string;
  rawValue: number;
  riskValue: number;
}

interface ScoredPoint {
  date: string;
  value: number;
  zScore: number;
}

const DEFAULT_START_DATE = "2026-01-01";

export function buildRealRiskHistory(
  series: RiskHistorySeries,
  startDate = DEFAULT_START_DATE,
): DailyRiskRecord[] {
  const vixRisk = buildSimpleRiskSeries(series.vix, 250);
  const creditRisk = buildSimpleRiskSeries(series.credit, 250);
  const yieldCurveRisk = buildYieldCurveRiskSeries(series.us10y, series.us2y);
  const trendRisk = buildTrendRiskSeries(series.sp500);
  const momentumRisk = buildMomentumRiskSeries(series.sp500);
  const spxByDate = cleanSeries(series.sp500);
  const ndxByDate = cleanSeries(series.nasdaq100);
  const spxMap = toPointMap(spxByDate);
  const ndxMap = toPointMap(ndxByDate);
  const scoreMaps = {
    volatility: createCarryForwardLookup(vixRisk),
    credit: createCarryForwardLookup(creditRisk),
    yieldCurve: createCarryForwardLookup(yieldCurveRisk),
    trend: createCarryForwardLookup(trendRisk),
    momentum: createCarryForwardLookup(momentumRisk),
  };

  return spxByDate
    .filter((point) => point.date >= startDate)
    .map((point) => {
      const date = point.date;
      const spx = spxMap.get(date);
      const ndx = ndxMap.get(date);
      const volatility = scoreMaps.volatility(date);
      const credit = scoreMaps.credit(date);
      const yieldCurve = scoreMaps.yieldCurve(date);
      const trend = scoreMaps.trend(date);
      const momentum = scoreMaps.momentum(date);

      if (!spx || !ndx || !volatility || !credit || !yieldCurve || !trend || !momentum) {
        return null;
      }

      const factorInputs = [
        {
          id: "volatility" as const,
          weight: RISK_FACTOR_WEIGHTS.volatility,
          zScore: volatility.zScore,
        },
        {
          id: "credit" as const,
          weight: RISK_FACTOR_WEIGHTS.credit,
          zScore: credit.zScore,
        },
        {
          id: "yieldCurve" as const,
          weight: RISK_FACTOR_WEIGHTS.yieldCurve,
          zScore: yieldCurve.zScore,
        },
        {
          id: "trend" as const,
          weight: RISK_FACTOR_WEIGHTS.trend,
          zScore: trend.zScore,
        },
        {
          id: "momentum" as const,
          weight: RISK_FACTOR_WEIGHTS.momentum,
          zScore: momentum.zScore,
        },
      ];
      const weightedZ = calculateWeightedRiskZ(factorInputs);
      const crisisFlag = detectCrisisFlag({
        weightedRiskZ: weightedZ,
        factors: factorInputs,
      });
      const riskScore = convertWeightedZToRiskScore(weightedZ, crisisFlag);

      return {
        date,
        riskScore,
        weightedZ,
        sentiment: getMarketState(riskScore),
        spxChange: round(percentChange(spx.value, spx.previous), 2),
        ndxChange: round(percentChange(ndx.value, ndx.previous), 2),
        vix: round(volatility.value, 2),
        dcaMultiplier: getDcaMultiplier(riskScore),
        source: "FRED" as const,
      };
    })
    .filter((record): record is DailyRiskRecord => Boolean(record));
}

export function buildRealRiskHistorySnapshot({
  series,
  generatedAt,
  startDate = DEFAULT_START_DATE,
}: {
  series: RiskHistorySeries;
  generatedAt: string;
  startDate?: string;
}): RealRiskHistory {
  const records = buildRealRiskHistory(series, startDate);

  if (records.length === 0) {
    throw new Error("真实历史风险数据为空，请检查 FRED 历史序列。");
  }

  return {
    schemaVersion: 1,
    generatedAt,
    source: "FRED daily historical series",
    startDate,
    endDate: records[records.length - 1].date,
    records,
  };
}

function buildSimpleRiskSeries(values: FredSeriesPoint[], windowDays: number) {
  return scoreRiskSeries(
    cleanSeries(values).map((point) => ({
      date: point.date,
      rawValue: point.value,
      riskValue: point.value,
    })),
    windowDays,
  );
}

function buildYieldCurveRiskSeries(
  tenYear: FredSeriesPoint[],
  twoYear: FredSeriesPoint[],
) {
  const twoYearMap = new Map(cleanSeries(twoYear).map((point) => [point.date, point.value]));
  const series = cleanSeries(tenYear)
    .map((point) => {
      const twoYearValue = twoYearMap.get(point.date);

      if (typeof twoYearValue !== "number") {
        return null;
      }

      const spread = round((point.value - twoYearValue) * 100, 2);

      return {
        date: point.date,
        rawValue: spread,
        riskValue: -spread,
      };
    })
    .filter((point): point is DerivedPoint => Boolean(point));

  return scoreRiskSeries(series, 250);
}

function buildTrendRiskSeries(sp500: FredSeriesPoint[]) {
  const clean = cleanSeries(sp500);
  const series = clean
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
    .filter((point): point is DerivedPoint => Boolean(point));

  return scoreRiskSeries(series, 120);
}

function buildMomentumRiskSeries(sp500: FredSeriesPoint[]) {
  const clean = cleanSeries(sp500);
  const series = clean
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
    .filter((point): point is DerivedPoint => Boolean(point));

  return scoreRiskSeries(series, 120);
}

function scoreRiskSeries(series: DerivedPoint[], windowDays: number): ScoredPoint[] {
  return series
    .map((point, index) => {
      if (index < windowDays - 1) {
        return null;
      }

      const windowValues = series
        .slice(index - windowDays + 1, index + 1)
        .map((item) => item.riskValue);
      return {
        date: point.date,
        value: point.rawValue,
        zScore: round(clipZScore(calculateRollingZ(point.riskValue, windowValues)), 2),
      };
    })
    .filter((point): point is ScoredPoint => Boolean(point));
}

function toPointMap(points: FredSeriesPoint[]) {
  const map = new Map<string, { value: number; previous: number | null }>();

  points.forEach((point, index) => {
    map.set(point.date, {
      value: point.value,
      previous: index > 0 ? points[index - 1].value : null,
    });
  });

  return map;
}

function createCarryForwardLookup(points: ScoredPoint[]) {
  const clean = [...points].sort((a, b) => a.date.localeCompare(b.date));
  let cursor = 0;
  let latest: ScoredPoint | null = null;

  return (date: string) => {
    while (cursor < clean.length && clean[cursor].date <= date) {
      latest = clean[cursor];
      cursor += 1;
    }

    return latest;
  };
}

function cleanSeries(values: FredSeriesPoint[]) {
  return values
    .filter((point) => point.date && Number.isFinite(point.value) && point.value > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function percentChange(value: number, previous: number | null) {
  if (previous === null || previous === 0) {
    return 0;
  }

  return ((value - previous) / previous) * 100;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

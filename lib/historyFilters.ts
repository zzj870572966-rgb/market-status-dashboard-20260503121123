import type { DailyRiskRecord } from "./riskHistory";

export type RiskScorePreset =
  | "all"
  | "0-20"
  | "20-40"
  | "40-60"
  | "60-75"
  | "75-90"
  | "90-97"
  | "97-100";

export type MarketReactionFilter =
  | "all"
  | "bothUp"
  | "bothDown"
  | "spxUpNdxDown"
  | "spxDownNdxUp"
  | "divergent";

export interface RiskScoreFilter {
  preset: RiskScorePreset;
  min?: number | null;
  max?: number | null;
}

export interface MarketPerformanceFilter {
  reaction: MarketReactionFilter;
  spxMin?: number | null;
  spxMax?: number | null;
  ndxMin?: number | null;
  ndxMax?: number | null;
}

export interface CombinedHistoryFilters {
  riskScore: RiskScoreFilter;
  performance: MarketPerformanceFilter;
}

export const RISK_SCORE_RANGES: Record<
  Exclude<RiskScorePreset, "all">,
  { min: number; max: number }
> = {
  "0-20": { min: 0, max: 20 },
  "20-40": { min: 20, max: 40 },
  "40-60": { min: 40, max: 60 },
  "60-75": { min: 60, max: 75 },
  "75-90": { min: 75, max: 90 },
  "90-97": { min: 90, max: 97 },
  "97-100": { min: 97, max: 100 },
};

export function getMarketReactionCategory(record: DailyRiskRecord) {
  if (record.spxChange > 0 && record.ndxChange > 0) {
    return "双涨";
  }

  if (record.spxChange < 0 && record.ndxChange < 0) {
    return "双跌";
  }

  if (record.spxChange > 0 && record.ndxChange < 0) {
    return "标普涨 / 纳指跌";
  }

  if (record.spxChange < 0 && record.ndxChange > 0) {
    return "标普跌 / 纳指涨";
  }

  if (record.spxChange * record.ndxChange < 0) {
    return "分化行情";
  }

  return "平盘附近";
}

export function applyRiskScoreFilter(
  records: DailyRiskRecord[],
  filter: RiskScoreFilter,
) {
  const bounds = getRiskScoreBounds(filter);

  if (!bounds) {
    return records;
  }

  if (bounds.min > bounds.max) {
    return [];
  }

  return records.filter(
    (record) => record.riskScore >= bounds.min && record.riskScore <= bounds.max,
  );
}

export function applyMarketPerformanceFilter(
  records: DailyRiskRecord[],
  filter: MarketPerformanceFilter,
) {
  if (hasInvalidReturnRange(filter)) {
    return [];
  }

  return records.filter((record) => {
    if (!matchesMarketReaction(record, filter.reaction)) {
      return false;
    }

    if (!withinOptionalRange(record.spxChange, filter.spxMin, filter.spxMax)) {
      return false;
    }

    if (!withinOptionalRange(record.ndxChange, filter.ndxMin, filter.ndxMax)) {
      return false;
    }

    return true;
  });
}

export function applyCombinedFilters(
  records: DailyRiskRecord[],
  filters: CombinedHistoryFilters,
) {
  return applyMarketPerformanceFilter(
    applyRiskScoreFilter(records, filters.riskScore),
    filters.performance,
  );
}

export function getRiskScoreBounds(filter: RiskScoreFilter) {
  const hasCustomMin = typeof filter.min === "number" && Number.isFinite(filter.min);
  const hasCustomMax = typeof filter.max === "number" && Number.isFinite(filter.max);

  if (hasCustomMin || hasCustomMax) {
    return {
      min: hasCustomMin ? clamp(filter.min as number, 0, 100) : 0,
      max: hasCustomMax ? clamp(filter.max as number, 0, 100) : 100,
    };
  }

  if (filter.preset === "all") {
    return null;
  }

  return RISK_SCORE_RANGES[filter.preset];
}

export function hasInvalidRiskScoreRange(filter: RiskScoreFilter) {
  const bounds = getRiskScoreBounds(filter);

  return Boolean(bounds && bounds.min > bounds.max);
}

export function hasInvalidReturnRange(filter: MarketPerformanceFilter) {
  return (
    hasInvalidNumberRange(filter.spxMin, filter.spxMax) ||
    hasInvalidNumberRange(filter.ndxMin, filter.ndxMax)
  );
}

function matchesMarketReaction(
  record: DailyRiskRecord,
  reaction: MarketReactionFilter,
) {
  if (reaction === "all") {
    return true;
  }

  if (reaction === "bothUp") {
    return record.spxChange > 0 && record.ndxChange > 0;
  }

  if (reaction === "bothDown") {
    return record.spxChange < 0 && record.ndxChange < 0;
  }

  if (reaction === "spxUpNdxDown") {
    return record.spxChange > 0 && record.ndxChange < 0;
  }

  if (reaction === "spxDownNdxUp") {
    return record.spxChange < 0 && record.ndxChange > 0;
  }

  return record.spxChange * record.ndxChange < 0;
}

function withinOptionalRange(
  value: number,
  min?: number | null,
  max?: number | null,
) {
  if (typeof min === "number" && Number.isFinite(min) && value < min) {
    return false;
  }

  if (typeof max === "number" && Number.isFinite(max) && value > max) {
    return false;
  }

  return true;
}

function hasInvalidNumberRange(min?: number | null, max?: number | null) {
  return (
    typeof min === "number" &&
    Number.isFinite(min) &&
    typeof max === "number" &&
    Number.isFinite(max) &&
    min > max
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

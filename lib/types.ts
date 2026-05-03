export type StatusLevel =
  | "positive"
  | "neutral"
  | "warning"
  | "danger"
  | "info"
  | "manual"
  | "stale";

export type SourceKey = "stooq" | "fred" | "alternative" | "manual";

export interface NumericPoint {
  value: number | null;
  previous?: number | null;
  change?: number | null;
  changePercent?: number | null;
  date: string;
  source: string;
  unit?: string;
  stale?: boolean;
}

export interface SentimentPoint extends NumericPoint {
  classification?: string;
}

export interface SourceStatus {
  ok: boolean;
  partial: boolean;
  updatedAt: string;
  message: string;
  succeeded: string[];
  failed: string[];
}

export interface MarketScore {
  value: number;
  label: string;
  level: StatusLevel;
  drivers: string[];
}

export interface MarketAssessment {
  title: string;
  summary: string;
  bullets: string[];
  action: string;
  riskLevel: string;
}

export interface ValuationData {
  sp500PE: NumericPoint;
  cape: NumericPoint;
  summary: string;
  date: string;
  source: string;
}

export interface OptionsStructure {
  date: string;
  source: string;
  spxNetGamma: {
    status: "positive" | "neutral" | "negative";
    label: string;
    description: string;
  };
  spxZeroGamma: NumericPoint;
  spxPutWall: NumericPoint;
  spxCallWall: NumericPoint;
  ndxQqqPutWall: string;
  ndxQqqCallWall: string;
  interpretation: string;
}

export interface MarketSnapshot {
  schemaVersion: number;
  asOf: string;
  generatedAt: string;
  status: {
    isPartial: boolean;
    message: string;
    sources: Record<SourceKey, SourceStatus>;
  };
  indices: {
    sp500: NumericPoint;
    nasdaq100: NumericPoint;
  };
  volatility: {
    vix: NumericPoint;
    vxn: NumericPoint;
  };
  rates: {
    us10y: NumericPoint;
    us2y: NumericPoint;
    yieldCurve2s10s: NumericPoint;
  };
  sentiment: {
    cnnFearGreed: SentimentPoint;
    cryptoFearGreed: SentimentPoint;
  };
  valuation: ValuationData;
  optionsStructure: OptionsStructure;
  score: MarketScore;
  assessment: MarketAssessment;
}

export interface HistoryIndexItem {
  date: string;
  path: string;
  score: number;
  sp500: number | null;
  nasdaq100: number | null;
  vix: number | null;
  cryptoFearGreed: number | null;
  partial: boolean;
}

export interface HistoryIndex {
  schemaVersion: number;
  updatedAt: string;
  items: HistoryIndexItem[];
}

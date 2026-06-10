export interface YahooDailyCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export interface YahooDailyResult {
  symbol: string;
  source: "Yahoo Finance";
  url: string;
  latest: YahooDailyCandle;
  previous: YahooDailyCandle | null;
  candles: YahooDailyCandle[];
}

export interface YahooSeriesPoint {
  date: string;
  value: number;
}

export async function fetchYahooDaily(
  symbol: string,
  range = "1mo",
): Promise<YahooDailyResult> {
  const history = await fetchYahooDailyHistory(symbol, range);

  return history;
}

export async function fetchYahooSeriesHistory(
  symbol: string,
  range = "3y",
): Promise<YahooSeriesPoint[]> {
  const history = await fetchYahooDailyHistory(symbol, range);

  return history.candles.map((candle) => ({
    date: candle.date,
    value: candle.close,
  }));
}

export async function fetchYahooDailyHistory(
  symbol: string,
  range = "3y",
): Promise<YahooDailyResult> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=${encodeURIComponent(range)}&interval=1d`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 market-status-dashboard/1.0",
      Accept: "application/json,text/plain,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo ${symbol} responded with ${response.status}`);
  }

  const payload = (await response.json()) as YahooChartResponse;
  const result = payload.chart?.result?.[0];

  if (!result) {
    const message = payload.chart?.error?.description ?? "empty chart response";
    throw new Error(`Yahoo ${symbol} returned ${message}`);
  }

  const candles = parseYahooCandles(result);

  if (candles.length === 0) {
    throw new Error(`Yahoo ${symbol} returned no usable daily candles`);
  }

  return {
    symbol,
    source: "Yahoo Finance",
    url,
    latest: candles[candles.length - 1],
    previous: candles.length > 1 ? candles[candles.length - 2] : null,
    candles,
  };
}

interface YahooChartResponse {
  chart?: {
    result?: YahooChartResult[];
    error?: {
      description?: string;
    } | null;
  };
}

interface YahooChartResult {
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: Array<number | null>;
      high?: Array<number | null>;
      low?: Array<number | null>;
      close?: Array<number | null>;
      volume?: Array<number | null>;
    }>;
    adjclose?: Array<{
      adjclose?: Array<number | null>;
    }>;
  };
}

function parseYahooCandles(result: YahooChartResult): YahooDailyCandle[] {
  const timestamps = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0];
  const adjClose = result.indicators?.adjclose?.[0]?.adjclose;

  if (!quote) {
    return [];
  }

  return timestamps
    .map((timestamp, index) => {
      const close = adjClose?.[index] ?? quote.close?.[index];
      const open = quote.open?.[index];
      const high = quote.high?.[index];
      const low = quote.low?.[index];

      if (
        !Number.isFinite(timestamp) ||
        !Number.isFinite(close) ||
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low)
      ) {
        return null;
      }

      return {
        date: new Date(timestamp * 1000).toISOString().slice(0, 10),
        open: round(open as number, 4),
        high: round(high as number, 4),
        low: round(low as number, 4),
        close: round(close as number, 4),
        volume: Number.isFinite(quote.volume?.[index])
          ? Number(quote.volume?.[index])
          : null,
      };
    })
    .filter((row): row is YahooDailyCandle => Boolean(row))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

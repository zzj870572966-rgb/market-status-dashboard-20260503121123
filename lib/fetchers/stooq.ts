export interface StooqCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export interface StooqDailyResult {
  symbol: string;
  source: "Stooq";
  url: string;
  latest: StooqCandle;
  previous: StooqCandle | null;
}

export async function fetchStooqDaily(symbol: string): Promise<StooqDailyResult> {
  const normalizedSymbol = symbol.toLowerCase();
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(normalizedSymbol)}&i=d`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "market-status-dashboard/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Stooq ${symbol} responded with ${response.status}`);
  }

  const csv = await response.text();
  const rows = parseStooqCsv(csv);

  if (rows.length > 0) {
    return {
      symbol,
      source: "Stooq",
      url,
      latest: rows[rows.length - 1],
      previous: rows.length > 1 ? rows[rows.length - 2] : null,
    };
  }

  return fetchStooqQuote(symbol);
}

async function fetchStooqQuote(symbol: string): Promise<StooqDailyResult> {
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol.toLowerCase())}&f=sd2t2ohlcv&h&e=csv`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "market-status-dashboard/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Stooq quote ${symbol} responded with ${response.status}`);
  }

  const csv = await response.text();
  const latest = parseStooqQuoteCsv(csv);

  if (!latest) {
    throw new Error(`Stooq ${symbol} returned no usable daily quote row`);
  }

  return {
    symbol,
    source: "Stooq",
    url,
    latest,
    previous: null,
  };
}

function parseStooqCsv(csv: string): StooqCandle[] {
  const lines = csv
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);

  if (lines.length < 2 || !lines[0].toLowerCase().startsWith("date,")) {
    return [];
  }

  return lines
    .slice(1)
    .map((line) => line.split(","))
    .filter((cols) => cols.length >= 5)
    .map((cols) => ({
      date: cols[0],
      open: Number(cols[1]),
      high: Number(cols[2]),
      low: Number(cols[3]),
      close: Number(cols[4]),
      volume: cols[5] && cols[5] !== "0" ? Number(cols[5]) : null,
    }))
    .filter(
      (row) =>
        row.date &&
        Number.isFinite(row.open) &&
        Number.isFinite(row.high) &&
        Number.isFinite(row.low) &&
        Number.isFinite(row.close),
    );
}

function parseStooqQuoteCsv(csv: string): StooqCandle | null {
  const lines = csv
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);

  if (lines.length < 2 || !lines[0].toLowerCase().startsWith("symbol,")) {
    return null;
  }

  const cols = lines[1].split(",");

  if (cols.length < 8 || cols.some((col) => col === "N/D")) {
    return null;
  }

  const row = {
    date: cols[1],
    open: Number(cols[3]),
    high: Number(cols[4]),
    low: Number(cols[5]),
    close: Number(cols[6]),
    volume: Number.isFinite(Number(cols[7])) ? Number(cols[7]) : null,
  };

  if (
    !row.date ||
    !Number.isFinite(row.open) ||
    !Number.isFinite(row.high) ||
    !Number.isFinite(row.low) ||
    !Number.isFinite(row.close)
  ) {
    return null;
  }

  return row;
}

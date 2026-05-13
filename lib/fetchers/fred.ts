export interface FredObservation {
  series: string;
  source: "FRED";
  url: string;
  latest: {
    date: string;
    value: number;
  };
  previous: {
    date: string;
    value: number;
  } | null;
}

export interface FredSeriesPoint {
  date: string;
  value: number;
}

export interface FredSeriesHistory {
  series: string;
  source: "FRED";
  url: string;
  observations: FredSeriesPoint[];
  latest: FredSeriesPoint;
  previous: FredSeriesPoint | null;
}

export async function fetchFredSeries(series: string): Promise<FredObservation> {
  const history = await fetchFredSeriesHistory(series);

  return {
    series,
    source: "FRED",
    url: history.url,
    latest: history.latest,
    previous: history.previous,
  };
}

export async function fetchFredSeriesHistory(
  series: string,
): Promise<FredSeriesHistory> {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(series)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "market-status-dashboard/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`FRED ${series} responded with ${response.status}`);
  }

  const csv = await response.text();
  const rows = parseFredCsv(csv, series);

  if (rows.length === 0) {
    throw new Error(`FRED ${series} returned no usable observations`);
  }

  return {
    series,
    source: "FRED",
    url,
    observations: rows,
    latest: rows[rows.length - 1],
    previous: rows.length > 1 ? rows[rows.length - 2] : null,
  };
}

function parseFredCsv(csv: string, series: string) {
  const lines = csv
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  return lines
    .slice(1)
    .map((line) => line.split(","))
    .filter((cols) => cols.length >= 2)
    .map((cols) => ({
      date: cols[0],
      value: cols[1] === "." ? Number.NaN : Number(cols[1]),
    }))
    .filter(
      (row) =>
        row.date &&
        Number.isFinite(row.value) &&
        row.date !== "observation_date" &&
        series.length > 0,
    );
}

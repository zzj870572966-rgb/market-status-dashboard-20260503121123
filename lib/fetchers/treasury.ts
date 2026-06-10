import type { FredSeriesPoint } from "./fred";

export interface TreasuryYieldCurveHistory {
  source: "US Treasury";
  url: string;
  us2y: FredSeriesPoint[];
  us10y: FredSeriesPoint[];
}

export async function fetchTreasuryYieldCurveHistory(
  years = defaultYears(),
): Promise<TreasuryYieldCurveHistory> {
  const results = await Promise.all(years.map(fetchTreasuryYieldCurveYear));
  const us2y = uniqueSorted(results.flatMap((result) => result.us2y));
  const us10y = uniqueSorted(results.flatMap((result) => result.us10y));

  if (us2y.length === 0 || us10y.length === 0) {
    throw new Error("US Treasury returned no usable 2Y/10Y observations");
  }

  return {
    source: "US Treasury",
    url: results.map((result) => result.url).join(" | "),
    us2y,
    us10y,
  };
}

async function fetchTreasuryYieldCurveYear(year: number) {
  const url = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=${year}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 market-status-dashboard/1.0",
      Accept: "application/xml,text/xml,text/plain,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`US Treasury ${year} responded with ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parseTreasuryYieldCurveXml(xml);

  return {
    url,
    us2y: parsed.us2y,
    us10y: parsed.us10y,
  };
}

function parseTreasuryYieldCurveXml(xml: string) {
  const entries = [...xml.matchAll(/<m:properties>([\s\S]*?)<\/m:properties>/g)];
  const us2y: FredSeriesPoint[] = [];
  const us10y: FredSeriesPoint[] = [];

  entries.forEach((entry) => {
    const body = entry[1];
    const date = getXmlValue(body, "NEW_DATE")?.slice(0, 10);
    const twoYear = Number(getXmlValue(body, "BC_2YEAR"));
    const tenYear = Number(getXmlValue(body, "BC_10YEAR"));

    if (!date) {
      return;
    }

    if (Number.isFinite(twoYear)) {
      us2y.push({ date, value: twoYear });
    }

    if (Number.isFinite(tenYear)) {
      us10y.push({ date, value: tenYear });
    }
  });

  return {
    us2y: uniqueSorted(us2y),
    us10y: uniqueSorted(us10y),
  };
}

function getXmlValue(xml: string, field: string) {
  const match = xml.match(new RegExp(`<d:${field}[^>]*>([^<]+)<\\/d:${field}>`));

  return match?.[1] ?? null;
}

function uniqueSorted(points: FredSeriesPoint[]) {
  const byDate = new Map<string, FredSeriesPoint>();

  points.forEach((point) => {
    if (point.date && Number.isFinite(point.value)) {
      byDate.set(point.date, point);
    }
  });

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function defaultYears() {
  const currentYear = new Date().getUTCFullYear();

  return [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
}

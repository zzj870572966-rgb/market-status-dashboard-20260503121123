export interface AlternativeFearGreedResult {
  source: "Alternative.me";
  url: string;
  value: number;
  classification: string;
  date: string;
  timestamp: number;
}

interface AlternativeApiResponse {
  data?: Array<{
    value?: string;
    value_classification?: string;
    timestamp?: string;
  }>;
}

export async function fetchCryptoFearGreed(): Promise<AlternativeFearGreedResult> {
  const url = "https://api.alternative.me/fng/?limit=1&format=json";
  const response = await fetch(url, {
    headers: {
      "User-Agent": "market-status-dashboard/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Alternative.me responded with ${response.status}`);
  }

  const json = (await response.json()) as AlternativeApiResponse;
  const latest = json.data?.[0];
  const value = Number(latest?.value);
  const timestamp = Number(latest?.timestamp);

  if (!latest || !Number.isFinite(value) || !Number.isFinite(timestamp)) {
    throw new Error("Alternative.me returned an invalid payload");
  }

  return {
    source: "Alternative.me",
    url,
    value,
    classification: latest.value_classification ?? "N/A",
    timestamp,
    date: new Date(timestamp * 1000).toISOString().slice(0, 10),
  };
}

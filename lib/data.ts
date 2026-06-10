import { promises as fs } from "node:fs";
import path from "node:path";
import type { HistoryIndex, MarketSnapshot } from "@/lib/types";

const latestPath = path.join(process.cwd(), "public", "data", "market-latest.json");
const historyIndexPath = path.join(
  process.cwd(),
  "public",
  "data",
  "history",
  "index.json",
);

export async function getMarketData(): Promise<MarketSnapshot> {
  try {
    const raw = await fs.readFile(latestPath, "utf8");
    return JSON.parse(raw) as MarketSnapshot;
  } catch {
    return createFallbackSnapshot();
  }
}

export async function getHistoryIndex(): Promise<HistoryIndex> {
  try {
    const raw = await fs.readFile(historyIndexPath, "utf8");
    return JSON.parse(raw) as HistoryIndex;
  } catch {
    return {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      items: [],
    };
  }
}

function createFallbackSnapshot(): MarketSnapshot {
  const now = new Date().toISOString();
  const staleSource = {
    ok: false,
    partial: true,
    updatedAt: now,
    message: "本地数据文件不可用，显示空白兜底数据。",
    succeeded: [],
    failed: ["market-latest.json"],
  };

  return {
    schemaVersion: 1,
    asOf: now.slice(0, 10),
    generatedAt: now,
    status: {
      isPartial: true,
      message: "部分数据暂未更新。",
      sources: {
        stooq: staleSource,
        fred: staleSource,
        yahoo: staleSource,
        treasury: staleSource,
        alternative: staleSource,
        manual: staleSource,
      },
    },
    indices: {
      sp500: emptyPoint("S&P 500"),
      nasdaq100: emptyPoint("Nasdaq 100"),
    },
    volatility: {
      vix: emptyPoint("VIX"),
      vxn: emptyPoint("VXN"),
    },
    rates: {
      us10y: emptyPoint("DGS10", "%"),
      us2y: emptyPoint("DGS2", "%"),
      yieldCurve2s10s: emptyPoint("2Y/10Y", "bp"),
    },
    sentiment: {
      cnnFearGreed: { ...emptyPoint("Manual"), classification: "N/A" },
      cryptoFearGreed: { ...emptyPoint("Alternative.me"), classification: "N/A" },
    },
    valuation: {
      sp500PE: emptyPoint("Manual"),
      cape: emptyPoint("Manual"),
      summary: "估值数据暂不可用。",
      date: now.slice(0, 10),
      source: "manual",
    },
    optionsStructure: {
      date: now.slice(0, 10),
      source: "manual",
      spxNetGamma: {
        status: "neutral",
        label: "N/A",
        description: "期权结构数据暂不可用。",
      },
      spxZeroGamma: emptyPoint("Manual"),
      spxPutWall: emptyPoint("Manual"),
      spxCallWall: emptyPoint("Manual"),
      ndxQqqPutWall: "N/A",
      ndxQqqCallWall: "N/A",
      interpretation: "期权结构数据暂不可用。",
    },
    score: {
      value: 50,
      label: "数据不足",
      level: "neutral",
      drivers: ["等待下一次成功更新。"],
    },
    assessment: {
      title: "今日数据评估",
      summary: "数据文件暂不可用，页面已进入兜底展示。",
      bullets: ["不会因数据源失败导致页面崩溃。"],
      action: "等待自动更新或手动运行 npm run update:data。",
      riskLevel: "未知",
    },
  };
}

function emptyPoint(source: string, unit?: string) {
  return {
    value: null,
    previous: null,
    change: null,
    changePercent: null,
    date: new Date().toISOString().slice(0, 10),
    source,
    unit,
    stale: true,
  };
}

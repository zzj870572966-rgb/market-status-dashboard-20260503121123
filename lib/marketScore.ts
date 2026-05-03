import type { MarketScore, MarketSnapshot, StatusLevel } from "./types";

export function calculateMarketScore(data: MarketSnapshot): MarketScore {
  let score = 50;
  const drivers: string[] = [];

  const spxChange = data.indices.sp500.changePercent;
  const ndxChange = data.indices.nasdaq100.changePercent;
  const vix = data.volatility.vix.value;
  const vxn = data.volatility.vxn.value;
  const cnn = data.sentiment.cnnFearGreed.value;
  const crypto = data.sentiment.cryptoFearGreed.value;
  const pe = data.valuation.sp500PE.value;
  const cape = data.valuation.cape.value;
  const curve = data.rates.yieldCurve2s10s.value;

  if (typeof spxChange === "number") {
    if (spxChange >= 1) {
      score += 5;
      drivers.push("S&P 500 日线表现偏强。");
    } else if (spxChange <= -1) {
      score -= 6;
      drivers.push("S&P 500 日线回撤增加短期压力。");
    }
  }

  if (typeof ndxChange === "number") {
    if (ndxChange >= 1.2) {
      score += 4;
      drivers.push("Nasdaq 100 风险偏好改善。");
    } else if (ndxChange <= -1.2) {
      score -= 5;
      drivers.push("Nasdaq 100 下跌显示成长股承压。");
    }
  }

  if (typeof vix === "number") {
    if (vix <= 15) {
      score += 12;
      drivers.push("VIX 处于低波动区间。");
    } else if (vix <= 20) {
      score += 6;
      drivers.push("VIX 仍在可控区间。");
    } else if (vix >= 30) {
      score -= 16;
      drivers.push("VIX 高企，风险溢价明显上升。");
    } else if (vix >= 25) {
      score -= 9;
      drivers.push("VIX 升至警戒区间。");
    }
  }

  if (typeof vxn === "number") {
    if (vxn <= 22) {
      score += 5;
      drivers.push("VXN 显示科技股波动温和。");
    } else if (vxn >= 35) {
      score -= 8;
      drivers.push("VXN 偏高，科技股波动风险上升。");
    }
  }

  if (typeof cnn === "number") {
    if (cnn < 25) {
      score -= 8;
      drivers.push("CNN Fear & Greed 处于恐惧区间。");
    } else if (cnn > 80) {
      score -= 7;
      drivers.push("CNN Fear & Greed 过热，追高性价比下降。");
    } else if (cnn >= 40 && cnn <= 65) {
      score += 4;
      drivers.push("CNN Fear & Greed 处于相对均衡区间。");
    }
  }

  if (typeof crypto === "number") {
    if (crypto < 25) {
      score -= 4;
      drivers.push("Crypto Fear & Greed 偏恐惧。");
    } else if (crypto > 80) {
      score -= 4;
      drivers.push("Crypto Fear & Greed 偏贪婪。");
    }
  }

  if (typeof pe === "number" && pe >= 25) {
    score -= 5;
    drivers.push("S&P 500 P/E 偏高，估值安全垫有限。");
  } else if (typeof pe === "number" && pe <= 19) {
    score += 5;
    drivers.push("S&P 500 P/E 回到相对温和区间。");
  }

  if (typeof cape === "number" && cape >= 35) {
    score -= 7;
    drivers.push("CAPE 偏高，长期估值压力仍需纳入。");
  }

  if (typeof curve === "number") {
    if (curve < 0) {
      score -= 6;
      drivers.push("2Y/10Y 利差倒挂，宏观周期信号偏谨慎。");
    } else if (curve > 50) {
      score += 4;
      drivers.push("2Y/10Y 利差为正，宏观压力有所缓和。");
    }
  }

  const value = clamp(Math.round(score), 0, 100);
  const { label, level } = labelScore(value);

  return {
    value,
    label,
    level,
    drivers: drivers.slice(0, 5),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function labelScore(value: number): { label: string; level: StatusLevel } {
  if (value <= 30) {
    return { label: "风险偏高", level: "danger" };
  }

  if (value <= 45) {
    return { label: "偏谨慎", level: "warning" };
  }

  if (value <= 65) {
    return { label: "中性", level: "neutral" };
  }

  if (value <= 80) {
    return { label: "偏积极", level: "positive" };
  }

  return { label: "过热观察", level: "info" };
}

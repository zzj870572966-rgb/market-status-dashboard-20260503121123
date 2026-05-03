import type { MarketAssessment, MarketScore, MarketSnapshot } from "./types";

export function buildDcaAssessment(
  data: MarketSnapshot,
  score: MarketScore,
): MarketAssessment {
  const bullets: string[] = [];
  const vix = data.volatility.vix.value;
  const cnn = data.sentiment.cnnFearGreed.value;
  const pe = data.valuation.sp500PE.value;
  const cape = data.valuation.cape.value;
  const curve = data.rates.yieldCurve2s10s.value;

  if (data.status.isPartial) {
    bullets.push("部分数据源本次未成功更新，已沿用最近一次成功数据。");
  }

  if (typeof vix === "number") {
    if (vix >= 25) {
      bullets.push("波动率偏高，适合降低单次投入强度并保留现金弹性。");
    } else if (vix <= 18) {
      bullets.push("波动率温和，定投节奏可以保持稳定。");
    }
  }

  if (typeof cnn === "number") {
    if (cnn >= 75) {
      bullets.push("情绪偏贪婪，新增仓位更适合分批而非一次性追入。");
    } else if (cnn <= 25) {
      bullets.push("情绪偏恐惧，可关注长期资金的分批布局窗口。");
    }
  }

  if (
    (typeof pe === "number" && pe >= 25) ||
    (typeof cape === "number" && cape >= 35)
  ) {
    bullets.push("估值处在偏高区间，未来回报预期需要更保守。");
  }

  if (typeof curve === "number" && curve < 0) {
    bullets.push("收益率曲线仍倒挂，宏观层面不宜忽视衰退风险。");
  }

  if (bullets.length === 0) {
    bullets.push("核心指标没有给出极端信号，维持常规定投纪律即可。");
  }

  return {
    title: "今日数据评估",
    summary: buildSummary(score, data.status.isPartial),
    bullets: bullets.slice(0, 5),
    action: buildAction(score.value),
    riskLevel: score.label,
  };
}

function buildSummary(score: MarketScore, isPartial: boolean) {
  const prefix = isPartial ? "在部分数据沿用旧值的情况下，" : "";

  if (score.value <= 30) {
    return `${prefix}市场状态评分处于风险区间，当前更强调防守、分批和现金管理。`;
  }

  if (score.value <= 45) {
    return `${prefix}市场状态偏谨慎，适合维持计划内定投，但降低冲动加仓。`;
  }

  if (score.value <= 65) {
    return `${prefix}市场状态整体中性，定投节奏以纪律和再平衡为主。`;
  }

  if (score.value <= 80) {
    return `${prefix}市场状态偏积极，但仍需要观察估值和情绪是否过热。`;
  }

  return `${prefix}市场状态较热，新增资金更适合等待回撤或拆分投入。`;
}

function buildAction(score: number) {
  if (score <= 30) {
    return "低速定投，优先控制风险。";
  }

  if (score <= 45) {
    return "维持小额分批，避免集中买入。";
  }

  if (score <= 65) {
    return "按计划定投，保持仓位纪律。";
  }

  if (score <= 80) {
    return "可以正常执行计划，但不追高。";
  }

  return "减少主动加仓，等待更好的风险回报。";
}

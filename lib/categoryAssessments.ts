import type {
  MarketAssessment,
  MarketSnapshot,
  OptionsStructure,
  StatusLevel,
} from "@/lib/types";

interface CategoryAssessment {
  assessment: MarketAssessment;
  level: StatusLevel;
}

export function buildSentimentAssessment(
  data: MarketSnapshot,
): CategoryAssessment {
  const cnn = data.sentiment.cnnFearGreed.value;
  const crypto = data.sentiment.cryptoFearGreed.value;
  const vix = data.volatility.vix.value;
  const vxn = data.volatility.vxn.value;
  const bullets: string[] = [];
  let score = 50;

  if (typeof cnn === "number") {
    if (cnn >= 80) {
      score -= 16;
      bullets.push("CNN Fear & Greed 进入过热区间，美股情绪层面不适合追高。");
    } else if (cnn >= 65) {
      score -= 7;
      bullets.push("CNN Fear & Greed 偏贪婪，新增仓位更适合拆分执行。");
    } else if (cnn <= 20) {
      score -= 10;
      bullets.push("CNN Fear & Greed 极度恐惧，短线情绪压力仍然明显。");
    } else if (cnn <= 35) {
      score -= 4;
      bullets.push("CNN Fear & Greed 偏恐惧，市场风险偏好仍未完全修复。");
    } else {
      score += 6;
      bullets.push("CNN Fear & Greed 处在中性区间，情绪没有给出极端信号。");
    }
  }

  if (typeof crypto === "number") {
    if (crypto >= 80) {
      score -= 10;
      bullets.push("Crypto Fear & Greed 偏极端贪婪，风险偏好可能已经拥挤。");
    } else if (crypto <= 20) {
      score -= 8;
      bullets.push("Crypto Fear & Greed 偏极端恐惧，加密风险偏好仍弱。");
    } else {
      score += 3;
      bullets.push("Crypto Fear & Greed 没有进入极端区间。");
    }
  }

  if (typeof vix === "number" && vix >= 25) {
    score -= 14;
    bullets.push("VIX 已进入警戒区间，美股恐慌溢价上升。");
  }

  if (typeof vxn === "number" && vxn >= 35) {
    score -= 10;
    bullets.push("VXN 偏高，科技股情绪波动需要单独警惕。");
  }

  const level = levelFromScore(score);
  const label = sentimentLabel(score);

  return {
    level,
    assessment: {
      title: "情绪评估",
      summary: sentimentSummary(score),
      bullets: ensureBullets(bullets),
      action:
        score >= 60
          ? "情绪环境较平稳，可按计划执行，但仍避免在贪婪升温时加速买入。"
          : "情绪波动偏大，新增资金更适合降低单次投入并等待确认。",
      riskLevel: label,
    },
  };
}

export function buildValuationAssessment(
  data: MarketSnapshot,
): CategoryAssessment {
  const pe = data.valuation.sp500PE.value;
  const cape = data.valuation.cape.value;
  const bullets: string[] = [];
  let score = 50;

  if (typeof pe === "number") {
    if (pe >= 28) {
      score -= 18;
      bullets.push("S&P 500 P/E 明显偏高，指数长期回报预期需要更保守。");
    } else if (pe >= 24) {
      score -= 10;
      bullets.push("S&P 500 P/E 偏高，新增资金不宜忽视估值压力。");
    } else if (pe <= 19) {
      score += 10;
      bullets.push("S&P 500 P/E 回到相对温和区间，估值压力有所缓和。");
    } else {
      score += 3;
      bullets.push("S&P 500 P/E 处在中间区间，估值不是最主要矛盾。");
    }
  }

  if (typeof cape === "number") {
    if (cape >= 38) {
      score -= 18;
      bullets.push("CAPE 明显偏高，长期估值均值回归风险较大。");
    } else if (cape >= 34) {
      score -= 10;
      bullets.push("CAPE 处在偏高区间，长期买入回报的安全垫有限。");
    } else if (cape <= 28) {
      score += 8;
      bullets.push("CAPE 未处于高压区间，长期估值约束相对温和。");
    } else {
      bullets.push("CAPE 处于观察区间，需要结合盈利和利率一起判断。");
    }
  }

  const level = levelFromScore(score);

  return {
    level,
    assessment: {
      title: "估值评估",
      summary:
        score >= 60
          ? "估值压力相对可控，长期资金可以维持纪律化配置。"
          : score >= 45
            ? "估值没有进入极端便宜区间，适合维持计划内定投。"
            : "估值压力偏高，当前更适合控制主动加仓速度。",
      bullets: ensureBullets(bullets),
      action:
        score >= 60
          ? "维持常规定投，并继续观察盈利与利率变化。"
          : "保持分批投入，避免把估值偏高阶段当作低风险窗口。",
      riskLevel: score >= 60 ? "估值温和" : score >= 45 ? "估值中性" : "估值偏高",
    },
  };
}

export function buildRiskAssessment(data: MarketSnapshot): CategoryAssessment {
  const vix = data.volatility.vix.value;
  const vxn = data.volatility.vxn.value;
  const curve = data.rates.yieldCurve2s10s.value;
  const gamma = data.optionsStructure.spxNetGamma.status;
  const bullets: string[] = [];
  let score = 50;

  if (typeof vix === "number") {
    if (vix >= 30) {
      score -= 24;
      bullets.push("VIX 高于 30，系统性波动风险显著上升。");
    } else if (vix >= 25) {
      score -= 14;
      bullets.push("VIX 高于 25，短期风险溢价进入警戒区间。");
    } else if (vix <= 18) {
      score += 8;
      bullets.push("VIX 处于温和区间，短期恐慌压力不高。");
    }
  }

  if (typeof vxn === "number") {
    if (vxn >= 35) {
      score -= 14;
      bullets.push("VXN 偏高，科技股波动风险需要单独管理。");
    } else if (vxn <= 24) {
      score += 5;
      bullets.push("VXN 处在可控区间，成长股波动没有明显失控。");
    }
  }

  if (typeof curve === "number" && curve < 0) {
    score -= 8;
    bullets.push("2Y/10Y 利差倒挂，宏观周期风险仍是底层约束。");
  }

  if (gamma === "negative") {
    score -= 8;
    bullets.push("SPX Net Gamma 为负，盘中波动可能更容易被放大。");
  } else if (gamma === "positive") {
    score += 5;
    bullets.push("SPX Net Gamma 为正，期权结构对波动有一定缓冲。");
  }

  const level = levelFromScore(score);

  return {
    level,
    assessment: {
      title: "风险评估",
      summary:
        score >= 60
          ? "风险指标整体可控，当前没有出现明显恐慌环境。"
          : score >= 45
            ? "风险指标处于观察区间，需要跟踪波动率和期权结构变化。"
            : "风险指标偏紧，短期更适合降低仓位动作的激进程度。",
      bullets: ensureBullets(bullets),
      action:
        score >= 60
          ? "可以保持原有计划，但继续监控 VIX、VXN 和 Gamma 状态。"
          : "控制单次投入金额，优先保留现金弹性和止损纪律。",
      riskLevel: score >= 60 ? "风险可控" : score >= 45 ? "风险观察" : "风险偏高",
    },
  };
}

export function buildMacroAssessment(data: MarketSnapshot): CategoryAssessment {
  const us10y = data.rates.us10y.value;
  const us2y = data.rates.us2y.value;
  const curve = data.rates.yieldCurve2s10s.value;
  const spx = data.indices.sp500.changePercent;
  const ndx = data.indices.nasdaq100.changePercent;
  const bullets: string[] = [];
  let score = 50;

  if (typeof curve === "number") {
    if (curve < -50) {
      score -= 18;
      bullets.push("2Y/10Y 深度倒挂，宏观周期信号明显偏谨慎。");
    } else if (curve < 0) {
      score -= 10;
      bullets.push("2Y/10Y 仍处倒挂状态，经济周期压力尚未解除。");
    } else if (curve > 50) {
      score += 8;
      bullets.push("2Y/10Y 利差为正且较宽，曲线形态对宏观压力有所缓和。");
    } else {
      bullets.push("2Y/10Y 利差接近中性区间，宏观信号仍需观察。");
    }
  }

  if (typeof us10y === "number") {
    if (us10y >= 5) {
      score -= 12;
      bullets.push("10Y 美债收益率偏高，权益估值折现压力上升。");
    } else if (us10y <= 4) {
      score += 5;
      bullets.push("10Y 美债收益率相对温和，对估值的压制有所降低。");
    }
  }

  if (typeof us2y === "number" && typeof us10y === "number" && us2y > us10y) {
    bullets.push("2Y 收益率高于 10Y，市场仍在定价偏紧的政策环境。");
  }

  if (typeof spx === "number" && typeof ndx === "number") {
    if (spx > 0 && ndx > 0) {
      score += 4;
      bullets.push("主要指数同步上涨，宏观压力暂未压制风险资产。");
    } else if (spx < 0 && ndx < 0) {
      score -= 4;
      bullets.push("主要指数同步走弱，宏观压力可能正在传导到风险资产。");
    }
  }

  const level = levelFromScore(score);

  return {
    level,
    assessment: {
      title: "宏观评估",
      summary:
        score >= 60
          ? "宏观指标对市场的压力相对温和，利率和曲线暂未形成强风险信号。"
          : score >= 45
            ? "宏观环境处于观察状态，利率水平和曲线形态需要持续跟踪。"
            : "宏观信号偏谨慎，利率或收益率曲线对权益市场形成压力。",
      bullets: ensureBullets(bullets),
      action:
        score >= 60
          ? "保持计划内配置，重点观察利率是否重新上行。"
          : "降低宏观不确定性下的集中投入，等待曲线和利率信号改善。",
      riskLevel: score >= 60 ? "宏观温和" : score >= 45 ? "宏观观察" : "宏观偏紧",
    },
  };
}

export function buildCryptoAssessment(data: MarketSnapshot): CategoryAssessment {
  const crypto = data.sentiment.cryptoFearGreed.value;
  const bullets: string[] = [];
  let score = 50;

  if (typeof crypto === "number") {
    if (crypto >= 85) {
      score -= 20;
      bullets.push("Crypto Fear & Greed 极度贪婪，加密风险偏好可能过度拥挤。");
    } else if (crypto >= 70) {
      score -= 10;
      bullets.push("Crypto Fear & Greed 偏贪婪，短期追涨性价比下降。");
    } else if (crypto <= 20) {
      score -= 12;
      bullets.push("Crypto Fear & Greed 极度恐惧，风险偏好仍然脆弱。");
    } else if (crypto <= 35) {
      score -= 4;
      bullets.push("Crypto Fear & Greed 偏恐惧，加密市场仍未明显转暖。");
    } else {
      score += 8;
      bullets.push("Crypto Fear & Greed 处于中性区间，未出现极端情绪。");
    }
  } else {
    bullets.push("Crypto Fear & Greed 暂无有效值，当前沿用兜底评估。");
  }

  const level = levelFromScore(score);

  return {
    level,
    assessment: {
      title: "加密情绪评估",
      summary:
        score >= 60
          ? "加密情绪相对平稳，对整体风险偏好的扰动有限。"
          : score >= 45
            ? "加密情绪处于观察区间，暂不适合作为主动加仓理由。"
            : "加密情绪偏极端，需要警惕风险偏好快速反转。",
      bullets: ensureBullets(bullets),
      action:
        score >= 60
          ? "加密情绪可作为辅助观察项，核心仓位仍按总览评分执行。"
          : "加密相关仓位更适合分批和小额，不把情绪指标当作实时信号。",
      riskLevel: score >= 60 ? "加密中性" : score >= 45 ? "加密观察" : "加密极端",
    },
  };
}

export function buildOptionsAssessment(data: MarketSnapshot): CategoryAssessment {
  const options = data.optionsStructure;
  const level = gammaStatusToLevel(options.spxNetGamma.status);

  return {
    level,
    assessment: {
      title: "期权结构评估",
      summary: optionsSummary(options),
      bullets: [
        `SPX Net Gamma：${options.spxNetGamma.label}。`,
        `SPX Zero Gamma 位于 ${formatValue(options.spxZeroGamma.value)}。`,
        `SPX Put Wall / Call Wall 分别位于 ${formatValue(options.spxPutWall.value)} 和 ${formatValue(options.spxCallWall.value)}。`,
        `NDX / QQQ Put Wall：${options.ndxQqqPutWall}；Call Wall：${options.ndxQqqCallWall}。`,
      ],
      action:
        options.spxNetGamma.status === "negative"
          ? "负 Gamma 环境下更需要控制追涨杀跌，观察指数是否接近关键墙位。"
          : "按手动墙位跟踪支撑和压力，暂不把期权结构作为独立交易信号。",
      riskLevel: options.spxNetGamma.label,
    },
  };
}

function sentimentLabel(score: number) {
  if (score >= 60) {
    return "情绪中性";
  }

  if (score >= 45) {
    return "情绪观察";
  }

  return "情绪极端";
}

function sentimentSummary(score: number) {
  if (score >= 60) {
    return "情绪指标整体平稳，恐慌和贪婪都没有形成单边极端压力。";
  }

  if (score >= 45) {
    return "情绪指标处于观察区间，需要警惕贪婪升温或恐慌扩散。";
  }

  return "情绪指标偏极端，短期市场更容易出现波动放大。";
}

function optionsSummary(options: OptionsStructure) {
  if (options.spxNetGamma.status === "positive") {
    return "期权结构偏正 Gamma，理论上对指数波动有一定缓冲。";
  }

  if (options.spxNetGamma.status === "negative") {
    return "期权结构偏负 Gamma，指数靠近关键墙位时波动可能被放大。";
  }

  return "期权结构处于中性 Gamma，重点观察 Zero Gamma、Put Wall 和 Call Wall 的位置。";
}

function gammaStatusToLevel(status: "positive" | "neutral" | "negative"): StatusLevel {
  if (status === "positive") {
    return "positive";
  }

  if (status === "negative") {
    return "warning";
  }

  return "neutral";
}

function levelFromScore(score: number): StatusLevel {
  if (score >= 65) {
    return "positive";
  }

  if (score >= 50) {
    return "neutral";
  }

  if (score >= 35) {
    return "warning";
  }

  return "danger";
}

function ensureBullets(bullets: string[]) {
  return bullets.length > 0 ? bullets.slice(0, 5) : ["当前分类暂无极端信号。"];
}

function formatValue(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

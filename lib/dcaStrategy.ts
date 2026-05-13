export type DcaState = "极度贪婪" | "贪婪" | "中性" | "恐慌" | "极度恐慌";

export interface DcaBand {
  min: number;
  max: number;
  state: DcaState;
  multiplier: number;
  advice: string;
  description: string;
}

export interface DcaStrategy {
  baseAmount: number;
  maxMultiplier: number;
  riskScore: number;
  state: DcaState;
  multiplier: number;
  actualAmount: number;
  advice: string;
  description: string;
}

export const BASE_MONTHLY_INVESTMENT_USD = 1000;
export const MAX_DCA_MULTIPLIER = 3;

export const DCA_BANDS: DcaBand[] = [
  {
    min: 0,
    max: 20,
    state: "极度贪婪",
    multiplier: 0.3,
    advice: "极度谨慎，减少投入",
    description:
      "市场情绪过热，长期资金保持最低节奏，避免在高估与乐观情绪中加速买入。",
  },
  {
    min: 20,
    max: 40,
    state: "贪婪",
    multiplier: 0.6,
    advice: "适当降低定投",
    description:
      "市场风险补偿偏低，保留现金流弹性，等待更好的长期配置窗口。",
  },
  {
    min: 40,
    max: 60,
    state: "中性",
    multiplier: 1,
    advice: "正常定投",
    description: "市场处于均衡区域，维持既定长期指数积累计划。",
  },
  {
    min: 60,
    max: 80,
    state: "恐慌",
    multiplier: 1.7,
    advice: "增加定投",
    description:
      "市场进入恐慌区间，长期指数资产的风险补偿上升，可提高分批投入力度。",
  },
  {
    min: 80,
    max: 100,
    state: "极度恐慌",
    multiplier: 2.5,
    advice: "强力加仓",
    description:
      "市场处于极度恐慌阶段，逆向定投价值提升，但仍需遵守现金流与风控边界。",
  },
];

export function getDcaStrategy(
  riskScore: number,
  baseAmount = BASE_MONTHLY_INVESTMENT_USD,
): DcaStrategy {
  const safeScore = clamp(Math.round(riskScore), 0, 100);
  const band =
    DCA_BANDS.find((item) =>
      safeScore === 100
        ? item.max === 100
        : safeScore >= item.min && safeScore < item.max,
    ) ?? DCA_BANDS[2];
  const multiplier = Math.min(band.multiplier, MAX_DCA_MULTIPLIER);

  return {
    baseAmount,
    maxMultiplier: MAX_DCA_MULTIPLIER,
    riskScore: safeScore,
    state: band.state,
    multiplier,
    actualAmount: Math.round(baseAmount * multiplier),
    advice: band.advice,
    description: band.description,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

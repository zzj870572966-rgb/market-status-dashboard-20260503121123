import {
  getDcaMultiplier,
  getMarketState,
  type RiskLevel,
} from "./riskDashboard";

export type DcaState = RiskLevel;

export interface DcaBand {
  min: number;
  max: number;
  state: DcaState;
  multiplier: number;
  advice: string;
  description: string;
}

export interface DcaStrategy {
  maxMultiplier: number;
  riskScore: number;
  state: DcaState;
  multiplier: number;
  advice: string;
  description: string;
}

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
    max: 75,
    state: "恐慌",
    multiplier: 1.4,
    advice: "增加定投",
    description:
      "市场进入恐慌区间，长期指数资产的风险补偿开始改善，可温和提高分批投入力度。",
  },
  {
    min: 75,
    max: 90,
    state: "高恐慌",
    multiplier: 1.8,
    advice: "提高定投",
    description:
      "市场处于高恐慌阶段，逆向定投价值上升，但仍需保持现金流稳定与分批纪律。",
  },
  {
    min: 90,
    max: 97,
    state: "极度恐慌",
    multiplier: 2.5,
    advice: "强力加仓",
    description:
      "市场处于极度恐慌阶段，逆向定投价值提升，但仍需遵守现金流与风控边界。",
  },
  {
    min: 97,
    max: 100,
    state: "危机级恐慌",
    multiplier: 3,
    advice: "危机级加仓上限",
    description:
      "市场进入危机级压力区间，定投倍率达到系统上限，仍需坚持分批执行与现金流约束。",
  },
];

export function getDcaStrategy(riskScore: number): DcaStrategy {
  const safeScore = clamp(Math.round(riskScore), 0, 100);
  const state = getMarketState(safeScore);
  const band = DCA_BANDS.find((item) => item.state === state) ?? DCA_BANDS[2];
  const multiplier = Math.min(getDcaMultiplier(safeScore), MAX_DCA_MULTIPLIER);

  return {
    maxMultiplier: MAX_DCA_MULTIPLIER,
    riskScore: safeScore,
    state: band.state,
    multiplier,
    advice: band.advice,
    description: band.description,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

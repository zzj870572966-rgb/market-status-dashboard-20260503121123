import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  Gauge,
  LineChart,
  ShieldAlert,
  Sigma,
  Target,
  TrendingDown,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DcaStrategyPanel from "@/components/DcaStrategyPanel";

type RiskLevel = "极度贪婪" | "贪婪" | "中性" | "恐慌" | "极度恐慌";

interface RiskFactor {
  name: string;
  source: string;
  value: string;
  benchmark: string;
  benchmarkLabel: string;
  zScore: number;
  weight: number;
  riskLevel: "低风险" | "中性" | "高风险" | "极高风险";
  progress: number;
  trend: "up" | "down" | "flat";
  icon: LucideIcon;
  window: string;
  note: string;
}

const marketState = {
  generatedAt: "模拟数据 · 未接入后端",
};

const factors: RiskFactor[] = [
  {
    name: "波动率风险",
    source: "VIX",
    value: "28.4",
    benchmark: "19.7",
    benchmarkLabel: "250日均值",
    zScore: 1.82,
    weight: 0.25,
    riskLevel: "高风险",
    progress: 78,
    trend: "up",
    icon: Activity,
    window: "250 个交易日",
    note: "VIX 越高，市场风险越高",
  },
  {
    name: "信用风险",
    source: "ICE BofA 美国高收益利差",
    value: "4.92%",
    benchmark: "3.41%",
    benchmarkLabel: "250日均值",
    zScore: 1.35,
    weight: 0.25,
    riskLevel: "高风险",
    progress: 69,
    trend: "up",
    icon: ShieldAlert,
    window: "250 个交易日",
    note: "信用利差越宽，市场风险越高",
  },
  {
    name: "收益率曲线风险",
    source: "10年期 - 2年期美债利差",
    value: "倒挂 42 bp",
    benchmark: "倒挂 8 bp",
    benchmarkLabel: "250日均值",
    zScore: 1.14,
    weight: 0.15,
    riskLevel: "高风险",
    progress: 63,
    trend: "up",
    icon: Waves,
    window: "250 个交易日",
    note: "倒挂越严重，市场风险越高",
  },
  {
    name: "趋势风险",
    source: "标普500 相对 200日均线",
    value: "-3.8%",
    benchmark: "+1.1%",
    benchmarkLabel: "120日均值",
    zScore: 0.94,
    weight: 0.15,
    riskLevel: "中性",
    progress: 56,
    trend: "down",
    icon: LineChart,
    window: "120 个交易日",
    note: "跌破均线越多，市场风险越高",
  },
  {
    name: "动能风险",
    source: "50日均线斜率",
    value: "-0.31%",
    benchmark: "+0.08%",
    benchmarkLabel: "120日均值",
    zScore: 1.48,
    weight: 0.2,
    riskLevel: "高风险",
    progress: 72,
    trend: "down",
    icon: TrendingDown,
    window: "120 个交易日",
    note: "动能越弱，市场风险越高",
  },
];

const ranges: Array<{
  range: string;
  label: RiskLevel;
  color: string;
  text: string;
}> = [
  {
    range: "0-20",
    label: "极度贪婪",
    color: "bg-emerald-400",
    text: "风险低，情绪过热",
  },
  {
    range: "20-40",
    label: "贪婪",
    color: "bg-lime-400",
    text: "风险偏低",
  },
  {
    range: "40-60",
    label: "中性",
    color: "bg-yellow-300",
    text: "风险均衡",
  },
  {
    range: "60-80",
    label: "恐慌",
    color: "bg-orange-400",
    text: "风险偏高",
  },
  {
    range: "80-100",
    label: "极度恐慌",
    color: "bg-red-500",
    text: "风险极高",
  },
];

const indexSnapshots = [
  {
    name: "标普500",
    ticker: "SPX",
    level: "5,412.8",
    change: -1.18,
    distance: "-3.8%",
    note: "低于 200日均线",
  },
  {
    name: "纳斯达克100",
    ticker: "NDX",
    level: "18,706.4",
    change: -1.74,
    distance: "-5.2%",
    note: "成长股动能偏弱",
  },
];

const weightedRisk = factors.reduce(
  (total, factor) => total + factor.weight * factor.zScore,
  0,
);
const normalizedRiskScore = normalizeWeightedZ(weightedRisk);
const currentRiskLevel = getRiskLevel(normalizedRiskScore);

export default function HomePage() {
  return (
    <main className="light-risk-dashboard smooth-risk-bg min-h-screen overflow-hidden bg-[#edf7ef] text-emerald-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Header />
        <RiskFactors />
        <RiskThermometer />
        <DcaStrategyPanel riskScore={normalizedRiskScore} />
        <section className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <RiskFormula />
          <MarketIndexPanel />
        </section>
        <AiSummary />
      </div>
    </main>
  );
}

function Header() {
  return (
    <section className="risk-glass rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-slate-700/70 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300">
            <Gauge className="h-4 w-4 text-cyan-300" aria-hidden="true" />
            机构市场温度终端
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
            市场温度计
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            基于滚动标准化风险因子构建的市场状态首页，当前展示为模拟数据。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
          <TopMetric
            label="当前市场状态"
            value={currentRiskLevel}
            tone="orange"
          />
          <TopMetric
            label="市场风险评分"
            value={`${normalizedRiskScore} / 100`}
            tone="orange"
          />
          <TopMetric
            label="组合风险姿态"
            value="防御"
            tone="cyan"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-4 text-xs text-slate-500">
        <span>{marketState.generatedAt}</span>
        <span className="h-1 w-1 rounded-full bg-slate-600" />
        <span>评分方向：数值越高 = 市场风险越高</span>
        <span className="h-1 w-1 rounded-full bg-slate-600" />
        <span>最终分数标准化至 0-100 区间</span>
      </div>
    </section>
  );
}

function TopMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "orange" | "cyan";
}) {
  const valueClass = tone === "orange" ? "text-orange-300" : "text-cyan-300";

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.26)]">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-3 text-2xl font-semibold tracking-normal ${valueClass}`}>
        {value}
      </div>
    </div>
  );
}

function RiskThermometer() {
  return (
    <section className="risk-glass risk-scanline mt-6 rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-normal text-white">
            主风险温度计
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            当前风险位置：{normalizedRiskScore}/100 → {currentRiskLevel}
          </p>
        </div>
        <div className="rounded-md border border-orange-400/30 bg-orange-400/10 px-3 py-2 text-sm font-medium text-orange-200">
          防御型风险环境
        </div>
      </div>

      <div className="mt-8">
        <div className="relative h-7 rounded-full border border-slate-700 bg-slate-950 p-1 shadow-inner">
          <div
            className="h-full rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #34d399 0%, #a3e635 22%, #fde047 48%, #fb923c 72%, #ef4444 100%)",
            }}
          />
          <div
            className="absolute top-1/2 z-10 -translate-y-1/2"
            style={{ left: `${normalizedRiskScore}%` }}
          >
            <div className="risk-pulse -ml-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-slate-950 shadow-[0_0_28px_rgba(251,146,60,0.7)]">
              <div className="h-3 w-3 rounded-full bg-orange-300" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2 text-center text-[11px] text-slate-400 sm:text-xs">
          {ranges.map((item) => (
            <div key={item.label} className="min-w-0">
              <div className={`mx-auto mb-2 h-1.5 w-full rounded-full ${item.color}`} />
              <div className="truncate font-medium text-slate-200">{item.label}</div>
              <div className="mt-1 text-slate-500">{item.range}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RiskFactors() {
  return (
    <section className="mt-6">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-normal text-white">
            五大风险因子
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            所有指标均统一转换为“数值越高，市场风险越高”的方向。
          </p>
        </div>
        <div className="text-xs text-slate-500">
          归一化方法：滚动 Z 值标准化
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {factors.map((factor) => (
          <RiskFactorCard key={factor.name} factor={factor} />
        ))}
      </div>
    </section>
  );
}

function RiskFactorCard({ factor }: { factor: RiskFactor }) {
  const Icon = factor.icon;
  const TrendIcon =
    factor.trend === "up"
      ? ArrowUpRight
      : factor.trend === "down"
        ? ArrowDownRight
        : Target;
  const levelColor = getLevelColor(factor.riskLevel);

  return (
    <article className="risk-glass rounded-lg p-4 transition duration-300 hover:border-slate-500/40 hover:bg-slate-900/80">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-lg border border-slate-700/70 bg-slate-950/70 p-2">
          <Icon className="h-5 w-5 text-slate-200" aria-hidden="true" />
        </div>
        <div
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${levelColor.badge}`}
        >
          <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {factor.riskLevel}
        </div>
      </div>

      <h3 className="mt-4 text-base font-semibold tracking-normal text-white">
        {factor.name}
      </h3>
      <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{factor.source}</p>

      <div className="mt-4 space-y-3">
        <DataRow label="当前值" value={factor.value} />
        <DataRow label="Z 值" value={formatSigned(factor.zScore)} />
        <DataRow label="权重" value={factor.weight.toFixed(2)} />
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>风险进度</span>
          <span>{factor.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full ${levelColor.bar}`}
            style={{ width: `${factor.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs leading-5 text-slate-400">
        <div>窗口：{factor.window}</div>
        <div>{factor.note}</div>
      </div>
    </article>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-100">{value}</span>
    </div>
  );
}

function RiskFormula() {
  const contributions = factors.map((factor) => ({
    ...factor,
    contribution: factor.weight * factor.zScore,
  }));
  const maxContribution = Math.max(
    ...contributions.map((factor) => Math.abs(factor.contribution)),
  );

  return (
    <section className="risk-glass rounded-lg p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sigma className="h-5 w-5 text-cyan-300" aria-hidden="true" />
            <h2 className="text-lg font-semibold tracking-normal text-white">
              量化风险评分模型
            </h2>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            将五个风险因子做滚动 Z 值标准化，统一方向后按权重合成。
          </p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-500">
          模型版本：多因子逆周期风控
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <div className="text-xs text-slate-500">加权风险 Z 值</div>
          <div className="mt-2 text-3xl font-semibold text-cyan-300">
            {formatSigned(weightedRisk)}
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-teal-500"
              style={{ width: `${Math.min(Math.abs(weightedRisk) * 32, 100)}%` }}
            />
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs text-slate-500">标准化风险分数</div>
          <div className="mt-2 text-3xl font-semibold text-orange-300">
            {normalizedRiskScore} / 100
          </div>
          <div className="mt-3 text-xs text-slate-500">
            分数 = 截断(50 + 25 × 加权风险Z值)
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/70">
        <div className="min-w-[760px] p-4">
          <div className="mb-4 grid grid-cols-[1.15fr_1.05fr_0.5fr_0.55fr_0.7fr] gap-3 text-xs font-medium text-slate-500">
            <div>风险因子</div>
            <div>当前 / 对比基准</div>
            <div>权重</div>
            <div>Z 值</div>
            <div>贡献</div>
          </div>
          <div className="space-y-3">
            {contributions.map((factor) => (
              <div
                key={factor.name}
                className="grid grid-cols-[1.15fr_1.05fr_0.5fr_0.55fr_0.7fr] items-center gap-3 text-sm"
              >
                <div>
                  <div className="font-medium text-slate-100">{factor.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{factor.window}</div>
                </div>
                <div>
                  <div className="font-mono font-medium text-slate-100">
                    {factor.value}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {factor.benchmarkLabel}：{factor.benchmark}
                  </div>
                </div>
                <div className="font-mono text-slate-300">
                  {factor.weight.toFixed(2)}
                </div>
                <div className="font-mono text-slate-300">
                  {formatSigned(factor.zScore)}
                </div>
                <div>
                  <div className="font-mono text-slate-100">
                    {formatSigned(factor.contribution)}
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{
                        width: `${Math.max(
                          8,
                          (Math.abs(factor.contribution) / maxContribution) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MarketIndexPanel() {
  return (
    <section className="risk-glass rounded-lg p-5">
      <div className="flex items-center gap-2">
        <LineChart className="h-5 w-5 text-emerald-300" aria-hidden="true" />
        <h2 className="text-lg font-semibold tracking-normal text-white">
          主要指数观察区
        </h2>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        后续用于接入标普500、纳斯达克100等核心指数涨跌与趋势状态。
      </p>

      <div className="mt-5 grid gap-3">
        {indexSnapshots.map((item) => (
          <div
            key={item.ticker}
            className="rounded-lg border border-slate-800 bg-slate-950/70 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">{item.name}</div>
                <div className="mt-1 text-xs text-slate-500">{item.ticker}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-semibold text-slate-100">
                  {item.level}
                </div>
                <div
                  className={`mt-1 text-sm font-medium ${
                    item.change >= 0 ? "text-emerald-300" : "text-orange-300"
                  }`}
                >
                  {formatSigned(item.change)}%
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                <div className="text-slate-500">相对 200日均线</div>
                <div className="mt-1 font-medium text-slate-100">{item.distance}</div>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                <div className="text-slate-500">趋势备注</div>
                <div className="mt-1 font-medium text-slate-100">{item.note}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 px-4 py-3 text-xs leading-5 text-slate-500">
        预留：后续可加入日涨跌、周涨跌、月涨跌、成交量、200日均线距离和趋势确认信号。
      </div>
    </section>
  );
}

function AiSummary() {
  return (
    <section className="risk-glass mt-6 rounded-lg border-cyan-400/20 p-5 shadow-[0_0_50px_rgba(34,211,238,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 p-2">
            <BrainCircuit className="h-5 w-5 text-cyan-200" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-normal text-white">
              智能风险总结
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              模拟摘要 · 后续可接入模型服务
            </p>
          </div>
        </div>
        <div className="rounded-md border border-orange-300/30 bg-orange-300/10 px-3 py-1.5 text-xs font-medium text-orange-200">
          当前结论：偏防御
        </div>
      </div>

      <p className="mt-5 max-w-5xl text-base leading-8 text-slate-200">
        当前市场风险主要受到波动率抬升、信用利差扩大以及市场动能转弱的影响。
        收益率曲线仍处于倒挂状态，说明宏观周期压力尚未完全解除。综合五大因子后，
        市场处于极度防御型风险环境，建议显著降低进攻性仓位，保留现金弹性，并等待波动率与信用条件同步改善。
      </p>
    </section>
  );
}

function getLevelColor(level: RiskFactor["riskLevel"]) {
  if (level === "低风险") {
    return {
      badge: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
      bar: "bg-emerald-400",
    };
  }

  if (level === "中性") {
    return {
      badge: "border-yellow-300/30 bg-yellow-300/10 text-yellow-100",
      bar: "bg-yellow-300",
    };
  }

  if (level === "高风险") {
    return {
      badge: "border-orange-400/30 bg-orange-400/10 text-orange-200",
      bar: "bg-orange-400",
    };
  }

  return {
    badge: "border-red-400/30 bg-red-400/10 text-red-200",
    bar: "bg-red-500",
  };
}

function formatSigned(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

function normalizeWeightedZ(value: number) {
  return Math.round(clamp(50 + value * 25, 0, 100));
}

function getRiskLevel(score: number): RiskLevel {
  if (score < 20) {
    return "极度贪婪";
  }

  if (score < 40) {
    return "贪婪";
  }

  if (score < 60) {
    return "中性";
  }

  if (score < 80) {
    return "恐慌";
  }

  return "极度恐慌";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

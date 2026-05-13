import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  CircleGauge,
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
import ManualRiskOverridePanel from "@/components/ManualRiskOverridePanel";
import snapshotData from "@/public/data/risk-dashboard-latest.json";
import { formatSigned, type RiskDashboardFactor, type RiskDashboardSnapshot } from "@/lib/riskDashboard";

const snapshot = snapshotData as RiskDashboardSnapshot;

const factorIcons: Record<RiskDashboardFactor["id"], LucideIcon> = {
  volatility: Activity,
  credit: ShieldAlert,
  yieldCurve: Waves,
  trend: LineChart,
  momentum: TrendingDown,
};

const ranges = [
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

export default function HomePage() {
  return (
    <main className="light-risk-dashboard smooth-risk-bg min-h-screen overflow-hidden bg-[#edf7ef] text-emerald-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Header />
        <RiskFactors />
        <RiskThermometer />
        <DcaStrategyPanel riskScore={snapshot.riskScore} />
        <section className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <RiskFormula />
          <MarketIndexPanel />
        </section>
        <ManualRiskOverridePanel snapshot={snapshot} />
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
            基于免费日频数据源、滚动 Z 值标准化与多因子权重构建，用于观察上一交易日收盘后的市场风险温度。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
          <TopMetric label="当前市场状态" value={snapshot.riskLevel} tone={getScoreTone(snapshot.riskScore)} />
          <TopMetric
            label="市场风险评分"
            value={`${snapshot.riskScore} / 100`}
            tone={getScoreTone(snapshot.riskScore)}
          />
          <TopMetric label="组合风险姿态" value={snapshot.posture} tone="cyan" />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-4 text-xs text-slate-500">
        <span>数据日期：{snapshot.asOf}</span>
        <span className="h-1 w-1 rounded-full bg-slate-600" />
        <span>生成时间：{formatDateTime(snapshot.generatedAt)}</span>
        <span className="h-1 w-1 rounded-full bg-slate-600" />
        <span>模型方向：分数越高 = 市场越恐慌</span>
      </div>

      {snapshot.status.isPartial ? (
        <div className="mt-4 rounded-md border border-orange-400/30 bg-orange-400/10 px-4 py-3 text-sm text-orange-200">
          {snapshot.status.message}
        </div>
      ) : null}
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
  tone: "green" | "yellow" | "orange" | "red" | "cyan";
}) {
  const valueClass = {
    green: "text-emerald-300",
    yellow: "text-yellow-100",
    orange: "text-orange-300",
    red: "text-red-200",
    cyan: "text-cyan-300",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.16)]">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-3 text-2xl font-semibold tracking-normal ${valueClass}`}>
        {value}
      </div>
    </div>
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
            所有指标均统一转换为“数值越高，市场风险越高”的方向，再进行滚动 Z 值标准化。
          </p>
        </div>
        <div className="text-xs text-slate-500">
          数据源：FRED 日频收盘序列
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {snapshot.factors.map((factor) => (
          <RiskFactorCard key={factor.id} factor={factor} />
        ))}
      </div>
    </section>
  );
}

function RiskFactorCard({ factor }: { factor: RiskDashboardFactor }) {
  const Icon = factorIcons[factor.id];
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
        <DataRow label="当前值" value={factor.rawDisplay} />
        <DataRow label="对比基准" value={factor.benchmarkDisplay} />
        <DataRow label="Z 值" value={formatSigned(factor.zScore)} />
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
        {factor.stale ? <div className="mt-1 text-orange-300">沿用最近一次成功数据</div> : null}
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

function RiskThermometer() {
  return (
    <section className="risk-glass risk-scanline mt-6 rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-normal text-white">
            主风险温度计
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            当前市场位置：{snapshot.riskScore}/100 → {snapshot.riskLevel}
          </p>
        </div>
        <div className="rounded-md border border-orange-400/30 bg-orange-400/10 px-3 py-2 text-sm font-medium text-orange-200">
          {snapshot.posture}型风险环境
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
            className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${snapshot.riskScore}%` }}
          >
            <div className="risk-pulse flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-slate-950 shadow-[0_0_28px_rgba(251,146,60,0.7)]">
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

function RiskFormula() {
  const maxContribution = Math.max(
    ...snapshot.factors.map((factor) => Math.abs(factor.contribution)),
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
            先把每个风险因子做滚动 Z 值标准化，再按权重合成，并映射到 0-100 的市场温度区间。
          </p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-500">
          模型版本：多因子逆周期风控
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <div className="text-xs text-slate-500">当前加权 Z 值</div>
          <div className="mt-2 text-3xl font-semibold text-cyan-300">
            {formatSigned(snapshot.weightedZ)}
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-teal-500"
              style={{ width: `${Math.min(Math.abs(snapshot.weightedZ) * 32, 100)}%` }}
            />
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs text-slate-500">标准化风险分数</div>
          <div className="mt-2 text-3xl font-semibold text-orange-300">
            {snapshot.riskScore} / 100
          </div>
          <div className="mt-3 text-xs text-slate-500">
            分数 = clamp(50 + 25 × 加权风险 Z 值)
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-100">
          <CircleGauge className="h-4 w-4 text-cyan-300" aria-hidden="true" />
          权重结构
        </div>
        <div className="grid gap-2 md:grid-cols-5">
          {snapshot.factors.map((factor) => (
            <div key={factor.id} className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-xs text-slate-500">{factor.name}</div>
              <div className="mt-2 font-mono text-lg font-semibold text-slate-100">
                {(factor.weight * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/70">
        <div className="min-w-[820px] p-4">
          <div className="mb-4 grid grid-cols-[1.1fr_1.1fr_0.45fr_0.55fr_0.7fr] gap-3 text-xs font-medium text-slate-500">
            <div>风险因子</div>
            <div>当前 / 对比基准</div>
            <div>权重</div>
            <div>Z 值</div>
            <div>贡献</div>
          </div>
          <div className="space-y-3">
            {snapshot.factors.map((factor) => (
              <div
                key={factor.id}
                className="grid grid-cols-[1.1fr_1.1fr_0.45fr_0.55fr_0.7fr] items-center gap-3 text-sm"
              >
                <div>
                  <div className="font-medium text-slate-100">{factor.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{factor.window}</div>
                </div>
                <div>
                  <div className="font-mono font-medium text-slate-100">
                    {factor.rawDisplay}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {factor.benchmarkLabel}：{factor.benchmarkDisplay}
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
                          maxContribution === 0
                            ? 8
                            : (Math.abs(factor.contribution) / maxContribution) * 100,
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
  const indices = [snapshot.indices.sp500, snapshot.indices.nasdaq100];

  return (
    <section className="risk-glass rounded-lg p-5">
      <div className="flex items-center gap-2">
        <LineChart className="h-5 w-5 text-emerald-300" aria-hidden="true" />
        <h2 className="text-lg font-semibold tracking-normal text-white">
          主要指数观察区
        </h2>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        用于观察标普500与纳斯达克100的收盘位置、日涨跌和相对 200日均线状态。
      </p>

      <div className="mt-5 grid gap-3">
        {indices.map((item) => (
          <div
            key={item.ticker}
            className="rounded-lg border border-slate-800 bg-slate-950/70 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">{item.name}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {item.ticker} · {item.source}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-semibold text-slate-100">
                  {item.levelDisplay}
                </div>
                <div
                  className={`mt-1 text-sm font-medium ${
                    (item.changePercent ?? 0) >= 0 ? "text-emerald-300" : "text-orange-300"
                  }`}
                >
                  {item.changePercent === null ? "N/A" : `${formatSigned(item.changePercent)}%`}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                <div className="text-slate-500">相对 200日均线</div>
                <div className="mt-1 font-medium text-slate-100">{item.distanceDisplay}</div>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                <div className="text-slate-500">趋势备注</div>
                <div className="mt-1 font-medium text-slate-100">{item.note}</div>
              </div>
            </div>
            {item.stale ? (
              <div className="mt-3 text-xs text-orange-300">沿用最近一次成功数据</div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 px-4 py-3 text-xs leading-5 text-slate-500">
        后续可以继续扩展：周涨跌、月涨跌、成交量、广度指标、行业风险扩散和回测曲线。
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
              基于规则模型生成 · 暂未接入 GPT
            </p>
          </div>
        </div>
        <div className="rounded-md border border-orange-300/30 bg-orange-300/10 px-3 py-1.5 text-xs font-medium text-orange-200">
          当前结论：{snapshot.posture}
        </div>
      </div>

      <p className="mt-5 max-w-5xl text-base leading-8 text-slate-200">
        {snapshot.summary}
      </p>
    </section>
  );
}

function getLevelColor(level: RiskDashboardFactor["riskLevel"]) {
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

function getScoreTone(score: number): "green" | "yellow" | "orange" | "red" {
  if (score < 40) {
    return "green";
  }

  if (score < 60) {
    return "yellow";
  }

  if (score < 80) {
    return "orange";
  }

  return "red";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Info,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import TerminalHoverNav from "@/components/TerminalHoverNav";
import { getDcaStrategy } from "@/lib/dcaStrategy";
import { getMarketReactionCategory } from "@/lib/historyFilters";
import {
  formatSigned,
  type RiskDashboardFactor,
  type RiskDashboardSnapshot,
} from "@/lib/riskDashboard";
import type { DailyRiskRecord, RealRiskHistory } from "@/lib/riskHistory";
import snapshotData from "@/public/data/risk-dashboard-latest.json";
import historyData from "@/public/data/risk-history/daily-records.json";

const snapshot = snapshotData as RiskDashboardSnapshot;
const riskHistory = historyData as RealRiskHistory;

const factorIcons: Record<RiskDashboardFactor["id"], LucideIcon> = {
  volatility: Activity,
  credit: ShieldAlert,
  yieldCurve: Waves,
  trend: TrendingUp,
  momentum: TrendingDown,
};

const riskBands = [
  { min: 0, max: 20, label: "极度贪婪", color: "bg-emerald-500", width: "20%" },
  { min: 20, max: 40, label: "贪婪", color: "bg-lime-500", width: "20%" },
  { min: 40, max: 60, label: "中性", color: "bg-amber-300", width: "20%" },
  { min: 60, max: 75, label: "恐慌", color: "bg-orange-400", width: "15%" },
  { min: 75, max: 90, label: "高恐慌", color: "bg-red-500", width: "15%" },
  { min: 90, max: 100, label: "极度恐慌", color: "bg-red-700", width: "10%" },
];

const latestRecords = [...riskHistory.records]
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 5);

export default function HomePage() {
  const dca = getDcaStrategy(snapshot.riskScore);
  const marketReaction = getMarketReaction(snapshot);

  return (
    <main className="light-risk-dashboard smooth-risk-bg min-h-screen overflow-hidden bg-[#f8f4ea] text-emerald-950">
      <TerminalHoverNav active="overview" tone="light" />
      <div className="mx-auto w-full max-w-[1480px] px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <TopBar />

        <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <RiskScorePanel />
          <div className="grid gap-3">
            <DcaAdvicePanel dca={dca} />
            <MarketPerformancePanel marketReaction={marketReaction} />
          </div>
        </section>

        <RiskFactors />
        <AiRiskSummary />
        <RecentRecords />
      </div>
    </main>
  );
}

function TopBar() {
  return (
    <header className="mb-5 flex flex-col gap-4 pl-16 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-emerald-950">
          市场温度计
        </h1>
        <p className="mt-1 text-sm text-emerald-900/58">
          基于美股最近一个完整交易日收盘数据计算的标准化市场风险仪表盘
        </p>
      </div>

      <div className="grid gap-2 text-right text-sm text-emerald-950/70">
        <div className="flex items-center justify-end gap-2">
          <span>数据日期（美东时间）</span>
          <span className="font-mono text-emerald-950">{snapshot.asOf}</span>
          <span className="text-emerald-900/58">（已收盘 EOD）</span>
          <Info className="h-4 w-4 text-emerald-900/48" aria-hidden="true" />
        </div>
        <div className="flex items-center justify-end gap-2 text-emerald-900/58">
          <span>数据基于美股最近一个交易日收盘后计算（EOD）</span>
          <Info className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}

function RiskScorePanel() {
  const tone = getScoreTone(snapshot.riskScore);

  return (
    <section className="risk-glass rounded-lg p-5 sm:p-8">
      <div className="flex items-center justify-center gap-2 text-base font-medium text-emerald-950">
        标准化风险评分
        <Info className="h-4 w-4 text-emerald-900/48" aria-hidden="true" />
      </div>

      <div className={`mt-4 text-center text-7xl font-semibold leading-none sm:text-8xl ${tone.text}`}>
        {snapshot.riskScore}
      </div>
      <div className={`mt-2 text-center text-2xl font-semibold ${tone.text}`}>
        {snapshot.riskLevel}
      </div>

      <RiskScale />

      <p className="mt-7 text-center text-lg leading-8 text-emerald-950/76">
        当前市场处于<span className={`px-1 font-semibold ${tone.text}`}>{snapshot.riskLevel}</span>
        阶段，适合以长期纪律和风险预算管理定投节奏。
      </p>
      <p className="mt-4 text-center text-sm text-emerald-900/52">
        更新时间：{snapshot.asOf}（美东收盘）
      </p>

      {snapshot.status.isPartial ? (
        <div className="mt-5 rounded-md border border-orange-500/20 bg-orange-50/82 px-4 py-3 text-sm text-orange-700">
          {snapshot.status.message}
        </div>
      ) : null}
    </section>
  );
}

function RiskScale() {
  return (
    <div className="mt-8">
      <div className="mb-3 grid grid-cols-[repeat(6,minmax(0,1fr))] text-xs text-emerald-950/78">
        {[0, 20, 40, 60, 75, 90, 100].map((value) => (
          <div key={value} className={value === 100 ? "text-right" : ""}>
            {value}
          </div>
        ))}
      </div>
      <div className="relative flex h-3 overflow-hidden rounded-full bg-emerald-100">
        {riskBands.map((band) => (
          <div
            key={band.label}
            className={`${band.color} h-full`}
            style={{ width: band.width }}
          />
        ))}
        <div
          className="absolute top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full bg-emerald-950 shadow-[0_0_0_3px_rgba(255,255,255,0.9)]"
          style={{ left: `${snapshot.riskScore}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm sm:grid-cols-6">
        {riskBands.map((band) => (
          <div key={band.label} className="text-emerald-900/62">
            {band.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function DcaAdvicePanel({
  dca,
}: {
  dca: ReturnType<typeof getDcaStrategy>;
}) {
  const tone = getScoreTone(dca.riskScore);

  return (
    <section className="risk-glass rounded-lg p-5">
      <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-emerald-950">
        动态定投建议
        <Info className="h-4 w-4 text-emerald-900/48" aria-hidden="true" />
      </div>
      <div className="grid gap-5 sm:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="text-sm text-emerald-900/58">当前定投倍率</div>
          <div className={`mt-2 text-4xl font-semibold ${tone.text}`}>
            {dca.multiplier.toFixed(1)}x
          </div>
          <div className={`mt-3 inline-flex rounded-md px-3 py-1 text-sm font-medium ${tone.badge}`}>
            {dca.state}
          </div>
        </div>
        <div className="border-t border-emerald-800/12 pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <div className="text-sm text-emerald-900/58">策略口径</div>
          <p className="mt-2 text-sm leading-7 text-emerald-950/76">
            {dca.description}
          </p>
          <div className="mt-3 text-sm font-medium text-emerald-800">
            {dca.advice}
          </div>
        </div>
      </div>
    </section>
  );
}

function MarketPerformancePanel({
  marketReaction,
}: {
  marketReaction: string;
}) {
  const spx = snapshot.indices.sp500;
  const ndx = snapshot.indices.nasdaq100;
  const sparklineRows = latestRecords.slice().reverse();

  return (
    <section className="risk-glass rounded-lg p-5">
      <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-emerald-950">
        市场表现（美股）
        <Info className="h-4 w-4 text-emerald-900/48" aria-hidden="true" />
      </div>

      <div className="space-y-3">
        <IndexRow
          name="S&P 500"
          change={spx.changePercent}
          values={sparklineRows.map((record) => record.spxChange)}
        />
        <IndexRow
          name="NASDAQ 100"
          change={ndx.changePercent}
          values={sparklineRows.map((record) => record.ndxChange)}
        />
      </div>

      <div className="mt-4 border-t border-emerald-800/12 pt-3 text-sm">
        <span className="text-emerald-900/60">市场反应：</span>
        <span className={marketReaction.includes("跌") ? "font-semibold text-red-600" : "font-semibold text-emerald-700"}>
          {marketReaction}
        </span>
      </div>
    </section>
  );
}

function IndexRow({
  name,
  change,
  values,
}: {
  name: string;
  change: number | null;
  values: number[];
}) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className="grid grid-cols-[1fr_0.7fr_1fr_0.55fr] items-center gap-4 text-sm">
      <div className="font-medium text-emerald-950/84">{name}</div>
      <div className={`font-mono font-medium ${isPositive ? "text-emerald-700" : "text-red-600"}`}>
        {change === null ? "N/A" : `${formatSigned(change)}%`}
      </div>
      <MiniSparkline values={values} positive={isPositive} />
      <div className={`rounded-md px-3 py-1 text-center text-sm font-medium ${isPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
        {isPositive ? "上涨" : "下跌"}
      </div>
    </div>
  );
}

function RiskFactors() {
  return (
    <section className="risk-glass mt-3 rounded-lg p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-normal text-emerald-950">
            五大风险因子
          </h2>
          <Info className="h-4 w-4 text-emerald-900/48" aria-hidden="true" />
        </div>
        <div className="hidden text-xs text-emerald-900/48 sm:block">
          鼠标悬停可查看详细数据
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
  const tone = getFactorTone(factor.riskLevel);

  return (
    <article
      title={`${factor.rawDisplay} / ${factor.benchmarkLabel}: ${factor.benchmarkDisplay}`}
      className="rounded-lg border border-emerald-800/12 bg-white/58 p-4 shadow-[0_10px_26px_rgba(67,96,70,0.06)] transition duration-200 hover:border-emerald-700/24 hover:bg-white/86"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-emerald-800/12 bg-white/76 p-2">
          <Icon className="h-5 w-5 text-emerald-950/76" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-emerald-950">{factor.name}</h3>
          <p className="mt-1 text-sm text-emerald-900/56">{shortFactorSource(factor)}</p>
        </div>
      </div>

      <div className={`mt-3 inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${tone.badge}`}>
        {factor.riskLevel}
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <DataRow label="Z-Score" value={formatSigned(factor.zScore)} valueClass={tone.text} />
        <DataRow label="权重" value={`${(factor.weight * 100).toFixed(0)}%`} />
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-emerald-100">
        <div
          className={`h-full rounded-full ${tone.bar}`}
          style={{ width: `${factor.progress}%` }}
        />
      </div>
    </article>
  );
}

function AiRiskSummary() {
  return (
    <section className="risk-glass mt-3 rounded-lg p-5">
      <div className="mb-3 flex items-center gap-2">
        <BrainCircuit className="h-5 w-5 text-emerald-700" aria-hidden="true" />
        <h2 className="text-lg font-semibold tracking-normal text-emerald-950">
          AI 风险驱动分析
        </h2>
        <Info className="h-4 w-4 text-emerald-900/48" aria-hidden="true" />
      </div>
      <p className="max-w-6xl text-sm leading-7 text-emerald-950/76">
        {snapshot.summary}
      </p>
      <p className="mt-2 text-xs text-emerald-900/48">
        说明：当前为规则模型生成摘要，暂未接入 GPT；用途是长期观察和定投纪律参考。
      </p>
    </section>
  );
}

function RecentRecords() {
  return (
    <section className="risk-glass mt-3 rounded-lg p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-normal text-emerald-950">
            最近 5 个交易日
          </h2>
          <Info className="h-4 w-4 text-emerald-900/48" aria-hidden="true" />
        </div>
        <Link
          href="/history"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-900/56 transition hover:text-emerald-950"
        >
          查看完整历史风险数据
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-emerald-800/12 bg-white/48">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead className="bg-[#fffdf6]/80 text-xs text-emerald-900/56">
            <tr>
              <th className="px-5 py-2 font-medium">日期</th>
              <th className="px-5 py-2 font-medium">标准化风险评分</th>
              <th className="px-5 py-2 font-medium">市场状态</th>
              <th className="px-5 py-2 font-medium">S&P 500 涨跌</th>
              <th className="px-5 py-2 font-medium">NASDAQ 100 涨跌</th>
              <th className="px-5 py-2 font-medium">VIX</th>
              <th className="px-5 py-2 font-medium">定投倍率</th>
            </tr>
          </thead>
          <tbody>
            {latestRecords.map((record) => (
              <RecentRecordRow key={record.date} record={record} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecentRecordRow({ record }: { record: DailyRiskRecord }) {
  const tone = getScoreTone(record.riskScore);

  return (
    <tr className="border-t border-emerald-800/10 transition hover:bg-emerald-50/46">
      <td className="px-5 py-2 font-mono text-emerald-950/82">{record.date}</td>
      <td className={`px-5 py-2 font-mono font-semibold ${tone.text}`}>{record.riskScore}</td>
      <td className={`px-5 py-2 font-medium ${tone.text}`}>{record.sentiment}</td>
      <td className={`px-5 py-2 font-mono ${returnClass(record.spxChange)}`}>
        {formatPercent(record.spxChange)}
      </td>
      <td className={`px-5 py-2 font-mono ${returnClass(record.ndxChange)}`}>
        {formatPercent(record.ndxChange)}
      </td>
      <td className="px-5 py-2 font-mono text-emerald-950/76">{record.vix.toFixed(1)}</td>
      <td className={`px-5 py-2 font-mono font-semibold ${tone.text}`}>
        {record.dcaMultiplier.toFixed(1)}x
      </td>
    </tr>
  );
}

function MiniSparkline({
  values,
  positive,
}: {
  values: number[];
  positive: boolean;
}) {
  const points = buildSparklinePoints(values);
  const stroke = positive ? "#047857" : "#dc2626";

  return (
    <svg
      viewBox="0 0 120 32"
      className="h-8 w-full"
      role="img"
      aria-label="最近五日走势"
    >
      <polyline
        fill="none"
        points={points}
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function DataRow({
  label,
  value,
  valueClass = "text-emerald-950/80",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-emerald-900/56">{label}</span>
      <span className={`font-mono font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

function buildSparklinePoints(values: number[]) {
  if (values.length === 0) {
    return "0,16 120,16";
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;

  return values
    .map((value, index) => {
      const x = values.length === 1 ? 60 : (index / (values.length - 1)) * 120;
      const y = 28 - ((value - min) / spread) * 24;

      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function getMarketReaction(snapshotValue: RiskDashboardSnapshot) {
  return getMarketReactionCategory({
    date: snapshotValue.asOf,
    riskScore: snapshotValue.riskScore,
    weightedZ: snapshotValue.weightedZ,
    clippedWeightedRiskZ: snapshotValue.weightedZ,
    rawWeightedRiskZ: snapshotValue.rawWeightedZ ?? snapshotValue.weightedZ,
    sentiment: snapshotValue.riskLevel,
    spxChange: snapshotValue.indices.sp500.changePercent ?? 0,
    ndxChange: snapshotValue.indices.nasdaq100.changePercent ?? 0,
    vix: snapshotValue.factors.find((factor) => factor.id === "volatility")?.rawValue ?? 0,
    dcaMultiplier: getDcaStrategy(snapshotValue.riskScore).multiplier,
    crisisFlag: snapshotValue.crisisFlag ?? false,
    crisisReason: snapshotValue.crisisReason ?? "",
    debug: {
      clippedWeightedRiskZ: snapshotValue.weightedZ,
      rawWeightedRiskZ: snapshotValue.rawWeightedZ ?? snapshotValue.weightedZ,
      factors: {
        volatility: { rawZ: 0, clippedZ: 0 },
        credit: { rawZ: 0, clippedZ: 0 },
        yieldCurve: { rawZ: 0, clippedZ: 0 },
        trend: { rawZ: 0, clippedZ: 0 },
        momentum: { rawZ: 0, clippedZ: 0 },
      },
      crisisFlag: snapshotValue.crisisFlag ?? false,
      crisisReason: snapshotValue.crisisReason ?? "",
    },
    source: "FRED",
  });
}

function getScoreTone(score: number) {
  if (score < 40) {
    return {
      text: "text-emerald-700",
      badge: "bg-emerald-50 text-emerald-700",
    };
  }

  if (score < 60) {
    return {
      text: "text-amber-700",
      badge: "bg-amber-50 text-amber-700",
    };
  }

  if (score < 90) {
    return {
      text: "text-orange-600",
      badge: "bg-orange-50 text-orange-700",
    };
  }

  return {
    text: "text-red-600",
    badge: "bg-red-50 text-red-600",
  };
}

function getFactorTone(level: RiskDashboardFactor["riskLevel"]) {
  if (level === "低风险") {
    return {
      text: "text-emerald-700",
      badge: "bg-emerald-50 text-emerald-700",
      bar: "bg-emerald-500",
    };
  }

  if (level === "中性") {
    return {
      text: "text-amber-700",
      badge: "bg-amber-50 text-amber-700",
      bar: "bg-amber-400",
    };
  }

  if (level === "高风险") {
    return {
      text: "text-orange-600",
      badge: "bg-orange-50 text-orange-700",
      bar: "bg-orange-500",
    };
  }

  return {
    text: "text-red-600",
    badge: "bg-red-50 text-red-600",
    bar: "bg-red-500",
  };
}

function shortFactorSource(factor: RiskDashboardFactor) {
  if (factor.id === "volatility") {
    return "VIX";
  }

  if (factor.id === "credit") {
    return "HY Spread";
  }

  if (factor.id === "yieldCurve") {
    return "10Y-2Y";
  }

  if (factor.id === "trend") {
    return "SPX vs 200MA";
  }

  return "50MA Slope";
}

function returnClass(value: number) {
  return value >= 0 ? "text-emerald-700" : "text-red-600";
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Database,
  Gauge,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import TerminalHoverNav from "@/components/TerminalHoverNav";
import { getDcaStrategy } from "@/lib/dcaStrategy";
import type { DailyRiskRecord, RealRiskHistory } from "@/lib/riskHistory";
import snapshotData from "@/public/data/risk-dashboard-latest.json";
import historyData from "@/public/data/risk-history/daily-records.json";
import type { RiskDashboardSnapshot } from "@/lib/riskDashboard";

const snapshot = snapshotData as RiskDashboardSnapshot;
const riskHistory = historyData as RealRiskHistory;

export default function HistoryRiskDataPage() {
  const records = [...riskHistory.records].sort((a, b) => b.date.localeCompare(a.date));
  const latest = records[0] ?? buildFallbackRecord();
  const statRecords = records.length > 0 ? records : [latest];
  const maxRisk = Math.max(...statRecords.map((record) => record.riskScore));
  const minRisk = Math.min(...statRecords.map((record) => record.riskScore));
  const recent30Average = average(statRecords.slice(0, 30).map((record) => record.riskScore));

  return (
    <main className="light-risk-dashboard smooth-risk-bg min-h-screen overflow-hidden bg-[#f8f4ea] text-emerald-950">
      <TerminalHoverNav active="history" tone="light" />
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-12 pt-20 sm:px-6 lg:px-8">
        <Header latestDate={latest.date} recordsCount={records.length} />

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            label="当前风险评分"
            value={`${latest.riskScore} / 100`}
            icon={Gauge}
            tone={scoreTone(latest.riskScore)}
          />
          <SummaryCard
            label="当前市场状态"
            value={latest.sentiment}
            icon={ShieldAlert}
            tone={scoreTone(latest.riskScore)}
          />
          <SummaryCard
            label="当前定投倍率"
            value={`${latest.dcaMultiplier.toFixed(1)}x`}
            icon={TrendingUp}
            tone="green"
          />
          <SummaryCard
            label="历史最高风险"
            value={`${maxRisk}`}
            icon={ArrowUpRight}
            tone={scoreTone(maxRisk)}
          />
          <SummaryCard
            label="历史最低风险"
            value={`${minRisk}`}
            icon={ArrowDownRight}
            tone="green"
          />
          <SummaryCard
            label="最近30日平均风险"
            value={`${Math.round(recent30Average)}`}
            icon={Activity}
            tone={scoreTone(recent30Average)}
          />
        </section>

        <RiskTable records={records} />
      </div>
    </main>
  );
}

function Header({
  latestDate,
  recordsCount,
}: {
  latestDate: string;
  recordsCount: number;
}) {
  return (
    <section className="risk-glass rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-emerald-800/15 bg-emerald-50/72 px-3 py-1.5 text-xs font-medium text-emerald-800">
            <Database className="h-4 w-4" aria-hidden="true" />
            日度风险数据库
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-emerald-950 sm:text-5xl">
            历史风险数据中心
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-900/64">
            基于美股日终数据的市场情绪与定投系统
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
          <div className="rounded-lg border border-emerald-800/12 bg-white/64 p-4 shadow-[0_10px_26px_rgba(67,96,70,0.08)]">
            <div className="flex items-center gap-2 text-xs text-emerald-900/55">
              <CalendarDays className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              最新完整交易日
            </div>
            <div className="mt-3 font-mono text-2xl font-semibold text-emerald-900">
              {latestDate}
            </div>
          </div>
          <div className="rounded-lg border border-emerald-800/12 bg-white/64 p-4 shadow-[0_10px_26px_rgba(67,96,70,0.08)]">
            <div className="text-xs text-emerald-900/55">记录数量</div>
            <div className="mt-3 font-mono text-2xl font-semibold text-emerald-950">
              {recordsCount}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-emerald-800/12 bg-white/58 px-4 py-3 text-xs leading-5 text-emerald-900/62">
        数据基于 FRED 日频历史序列逐日滚动计算。当前页面使用 2026-01-01 起的真实日终记录，利率、信用与波动率序列若当日暂未发布，则沿用最近一次已发布值参与计算。
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Gauge;
  tone: "green" | "yellow" | "orange" | "red";
}) {
  const toneClass = {
    green: "text-emerald-800 border-emerald-700/16 bg-emerald-50/70",
    yellow: "text-amber-700 border-amber-500/20 bg-amber-50/70",
    orange: "text-orange-700 border-orange-500/20 bg-orange-50/74",
    red: "text-red-700 border-red-500/20 bg-red-50/72",
  }[tone];

  return (
    <article className="risk-glass rounded-lg p-4 transition duration-300 hover:border-emerald-700/20 hover:bg-white/82">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-emerald-900/55">{label}</div>
        <div className={`rounded-md border p-1.5 ${toneClass}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
      <div className={`mt-4 text-2xl font-semibold tracking-normal ${toneClass.split(" ")[0]}`}>
        {value}
      </div>
    </article>
  );
}

function RiskTable({ records }: { records: DailyRiskRecord[] }) {
  return (
    <section className="risk-glass mt-6 overflow-hidden rounded-lg">
      <div className="flex flex-col gap-2 border-b border-emerald-800/12 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-normal text-emerald-950">
            日度风险记录
          </h2>
          <p className="mt-1 text-xs text-emerald-900/55">
            每一行对应一个完整美股交易日的日终风险状态
          </p>
        </div>
        <div className="text-xs text-emerald-900/55">
          日度记录按最新交易日倒序排列
        </div>
      </div>

      <div className="max-h-[680px] overflow-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[#fffdf6]">
            <tr className="border-b border-emerald-800/12 text-[11px] uppercase tracking-[0.12em] text-emerald-900/48">
              <th className="px-5 py-3 font-medium">日期</th>
              <th className="px-5 py-3 font-medium">风险评分</th>
              <th className="px-5 py-3 font-medium">市场状态</th>
              <th className="px-5 py-3 font-medium">SPX涨跌</th>
              <th className="px-5 py-3 font-medium">NDX涨跌</th>
              <th className="px-5 py-3 font-medium">VIX</th>
              <th className="px-5 py-3 font-medium">定投倍率</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={record.date}
                className="border-b border-emerald-800/10 text-sm transition duration-200 hover:bg-emerald-100/38"
              >
                <td className="px-5 py-3 font-mono text-emerald-950/82">{record.date}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex min-w-16 justify-center rounded-md border px-2.5 py-1 font-mono text-sm font-semibold ${riskBadgeClass(record.riskScore)}`}
                  >
                    {record.riskScore}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${sentimentClass(record.riskScore)}`}>
                    {record.sentiment}
                  </span>
                </td>
                <td className={`px-5 py-3 font-mono font-medium ${returnClass(record.spxChange)}`}>
                  {formatPercent(record.spxChange)}
                </td>
                <td className={`px-5 py-3 font-mono font-medium ${returnClass(record.ndxChange)}`}>
                  {formatPercent(record.ndxChange)}
                </td>
                <td className="px-5 py-3 font-mono text-emerald-950/78">
                  {record.vix.toFixed(1)}
                </td>
                <td className="px-5 py-3 font-mono font-semibold text-emerald-800">
                  {record.dcaMultiplier.toFixed(1)}x
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function scoreTone(score: number): "green" | "yellow" | "orange" | "red" {
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

function riskBadgeClass(score: number) {
  if (score < 40) {
    return "border-emerald-700/18 bg-emerald-50/80 text-emerald-800";
  }

  if (score < 60) {
    return "border-amber-500/22 bg-amber-50/82 text-amber-700";
  }

  if (score < 80) {
    return "border-orange-500/22 bg-orange-50/84 text-orange-700";
  }

  return "border-red-500/24 bg-red-50/84 text-red-700";
}

function sentimentClass(score: number) {
  if (score < 40) {
    return "bg-emerald-50/90 text-emerald-800";
  }

  if (score < 60) {
    return "bg-amber-50/90 text-amber-700";
  }

  if (score < 80) {
    return "bg-orange-50/90 text-orange-700";
  }

  return "bg-red-50/90 text-red-700";
}

function returnClass(value: number) {
  return value >= 0 ? "text-emerald-700" : "text-red-700";
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildFallbackRecord(): DailyRiskRecord {
  const volatility = snapshot.factors.find((factor) => factor.id === "volatility");
  const strategy = getDcaStrategy(snapshot.riskScore);

  return {
    date: snapshot.asOf,
    riskScore: snapshot.riskScore,
    weightedZ: snapshot.weightedZ,
    sentiment: snapshot.riskLevel,
    spxChange: snapshot.indices.sp500.changePercent ?? 0,
    ndxChange: snapshot.indices.nasdaq100.changePercent ?? 0,
    vix: volatility?.rawValue ?? 0,
    dcaMultiplier: strategy.multiplier,
    source: "FRED",
  };
}

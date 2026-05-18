import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  CalendarRange,
  Gauge,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import TerminalHoverNav from "@/components/TerminalHoverNav";
import { getDcaStrategy } from "@/lib/dcaStrategy";
import type { DailyRiskRecord, RealRiskHistory } from "@/lib/riskHistory";
import historyData from "@/public/data/risk-history/daily-records.json";

const riskHistory = historyData as RealRiskHistory;

export default function WeeklyDcaPage() {
  const records = [...riskHistory.records].sort((a, b) => a.date.localeCompare(b.date));
  const weekly = buildWeeklyDecision(records);
  const strategy = getDcaStrategy(weekly.weeklyScore);
  const maxRisk = Math.max(...weekly.sourceRecords.map((record) => record.riskScore));
  const minRisk = Math.min(...weekly.sourceRecords.map((record) => record.riskScore));
  const spxTotal = sum(weekly.sourceRecords.map((record) => record.spxChange));
  const ndxTotal = sum(weekly.sourceRecords.map((record) => record.ndxChange));

  return (
    <main className="light-risk-dashboard smooth-risk-bg min-h-screen overflow-hidden bg-[#f8f4ea] text-emerald-950">
      <TerminalHoverNav active="weekly" tone="light" />
      <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-20 sm:px-6 lg:px-8">
        <Header weekly={weekly} />

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <WeeklyScorePanel weekly={weekly} strategy={strategy} />
          <DecisionPanel weekly={weekly} strategy={strategy} />
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="上周平均评分" value={`${weekly.weeklyScore} / 100`} icon={Gauge} tone={scoreTone(weekly.weeklyScore)} />
          <MetricCard label="本周定投倍率" value={`${strategy.multiplier.toFixed(1)}x`} icon={TrendingUp} tone="green" />
          <MetricCard label="上周最高风险" value={`${maxRisk}`} icon={ArrowUpRight} tone={scoreTone(maxRisk)} />
          <MetricCard label="上周最低风险" value={`${minRisk}`} icon={ArrowDownRight} tone="green" />
          <MetricCard label="样本交易日" value={`${weekly.sourceRecords.length} 日`} icon={CalendarRange} tone="green" />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <WeeklyRecordsTable records={weekly.sourceRecords} />
          <WeeklyAnalysis
            weekly={weekly}
            multiplier={strategy.multiplier}
            spxTotal={spxTotal}
            ndxTotal={ndxTotal}
          />
        </section>
      </div>
    </main>
  );
}

function Header({ weekly }: { weekly: WeeklyDecision }) {
  return (
    <section className="risk-glass rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-emerald-800/14 bg-emerald-50/64 px-3 py-1.5 text-xs font-medium text-emerald-800">
            <CalendarRange className="h-4 w-4" aria-hidden="true" />
            周度执行模型
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-emerald-950 sm:text-5xl">
            周度定投评分
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-950/64">
            使用上一个完整 5 个交易日的标准化风险评分均值，作为下一周执行定投倍率的依据，减少单日噪音和情绪化调整。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
          <div className="rounded-lg border border-emerald-800/12 bg-white/52 p-4">
            <div className="text-xs text-emerald-900/52">评分来源周</div>
            <div className="mt-2 font-mono text-xl font-semibold text-emerald-950">
              {weekly.sourceStart} 至 {weekly.sourceEnd}
            </div>
          </div>
          <div className="rounded-lg border border-emerald-800/12 bg-white/52 p-4">
            <div className="text-xs text-emerald-900/52">执行周</div>
            <div className="mt-2 font-mono text-xl font-semibold text-emerald-950">
              {weekly.executionStart} 至 {weekly.executionEnd}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WeeklyScorePanel({
  weekly,
  strategy,
}: {
  weekly: WeeklyDecision;
  strategy: ReturnType<typeof getDcaStrategy>;
}) {
  const tone = scoreTone(weekly.weeklyScore);

  return (
    <section className="risk-glass rounded-lg p-5 sm:p-7">
      <div className="flex items-center gap-2 text-sm font-medium text-emerald-900/58">
        <Activity className="h-4 w-4 text-emerald-700" aria-hidden="true" />
        上周 5 个交易日平均评分
      </div>
      <div className={`mt-5 text-7xl font-semibold leading-none sm:text-8xl ${tone.text}`}>
        {weekly.weeklyScore}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${tone.text}`}>
        {strategy.state}
      </div>

      <div className="mt-8 rounded-lg border border-emerald-800/12 bg-white/48 p-4">
        <div className="mb-3 flex items-center justify-between text-xs text-emerald-900/54">
          <span>周度评分温度条</span>
          <span>{weekly.weeklyScore}/100</span>
        </div>
        <div className="relative h-4 overflow-hidden rounded-full bg-emerald-100">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,#10b981_0%,#84cc16_22%,#facc15_48%,#fb923c_72%,#ef4444_100%)]" />
          <div
            className="absolute top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-full bg-emerald-950 shadow-[0_0_0_3px_rgba(255,255,255,0.92)]"
            style={{ left: `${weekly.weeklyScore}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px] text-emerald-900/50 sm:grid-cols-7">
          {[
            ["0-20", "0.5x"],
            ["20-40", "0.7x"],
            ["40-60", "1.0x"],
            ["60-75", "1.3x"],
            ["75-90", "1.7x"],
            ["90-97", "2.2x"],
            ["97-100", "3.0x"],
          ].map(([range, multiplier]) => (
            <div key={range} className="rounded-md bg-white/44 px-2 py-2">
              <div className="font-mono text-emerald-950">{range}</div>
              <div className="mt-1">{multiplier}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DecisionPanel({
  weekly,
  strategy,
}: {
  weekly: WeeklyDecision;
  strategy: ReturnType<typeof getDcaStrategy>;
}) {
  return (
    <section className="risk-glass rounded-lg p-5 sm:p-7">
      <div className="flex items-center gap-2 text-lg font-semibold text-emerald-950">
        <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
        本周定投执行建议
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-800/12 bg-white/54 p-5">
          <div className="text-sm text-emerald-900/54">定投倍率</div>
          <div className="mt-3 text-5xl font-semibold text-emerald-800">
            {strategy.multiplier.toFixed(1)}x
          </div>
        </div>
        <div className="rounded-lg border border-emerald-800/12 bg-white/54 p-5">
          <div className="text-sm text-emerald-900/54">执行状态</div>
          <div className="mt-3 text-3xl font-semibold text-emerald-950">
            {strategy.state}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-emerald-800/12 bg-[linear-gradient(135deg,rgba(236,253,245,0.62),rgba(255,253,246,0.72))] p-4">
        <div className="text-sm font-medium text-emerald-950">计算口径</div>
        <p className="mt-3 text-sm leading-7 text-emerald-950/72">
          本周倍率由 {weekly.sourceStart} 至 {weekly.sourceEnd} 的 5 个交易日风险评分平均值决定。该方法用于长期指数定投节奏管理，不随单日波动频繁改变。
        </p>
      </div>

      <div className="mt-5 rounded-lg border border-emerald-800/12 bg-white/46 p-4">
        <div className="text-sm font-medium text-emerald-950">策略解释</div>
        <p className="mt-3 text-sm leading-7 text-emerald-950/72">
          {strategy.description} 当前执行周为 {weekly.executionStart} 至 {weekly.executionEnd}，建议以该倍率作为本周定投计划的参考上限。
        </p>
      </div>
    </section>
  );
}

function WeeklyRecordsTable({ records }: { records: DailyRiskRecord[] }) {
  return (
    <section className="risk-glass rounded-lg p-5">
      <div className="mb-4 flex items-center gap-2">
        <CalendarRange className="h-5 w-5 text-emerald-700" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-emerald-950">评分来源交易日</h2>
      </div>

      <div className="overflow-hidden rounded-lg border border-emerald-800/12 bg-white/46">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-[#fffdf6]/82 text-xs text-emerald-900/54">
            <tr>
              <th className="px-4 py-3 font-medium">日期</th>
              <th className="px-4 py-3 font-medium">风险评分</th>
              <th className="px-4 py-3 font-medium">市场状态</th>
              <th className="px-4 py-3 font-medium">SPX涨跌</th>
              <th className="px-4 py-3 font-medium">NDX涨跌</th>
              <th className="px-4 py-3 font-medium">当日倍率</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const tone = scoreTone(record.riskScore);

              return (
                <tr key={record.date} className="border-t border-emerald-800/10">
                  <td className="px-4 py-3 font-mono text-emerald-950/76">{record.date}</td>
                  <td className={`px-4 py-3 font-mono font-semibold ${tone.text}`}>
                    {record.riskScore}
                  </td>
                  <td className={`px-4 py-3 font-medium ${tone.text}`}>{record.sentiment}</td>
                  <td className={`px-4 py-3 font-mono ${returnClass(record.spxChange)}`}>
                    {formatPercent(record.spxChange)}
                  </td>
                  <td className={`px-4 py-3 font-mono ${returnClass(record.ndxChange)}`}>
                    {formatPercent(record.ndxChange)}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-emerald-800">
                    {record.dcaMultiplier.toFixed(1)}x
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WeeklyAnalysis({
  weekly,
  multiplier,
  spxTotal,
  ndxTotal,
}: {
  weekly: WeeklyDecision;
  multiplier: number;
  spxTotal: number;
  ndxTotal: number;
}) {
  const direction =
    weekly.weeklyScore < 40
      ? "上周市场风险均值偏低，系统更强调纪律性和节奏控制。"
      : weekly.weeklyScore < 60
        ? "上周市场风险均值处于中性区间，适合维持常规长期计划。"
        : "上周市场风险均值偏高，逆向定投价值有所提升，但仍应分批执行。";

  return (
    <section className="risk-glass rounded-lg p-5">
      <div className="mb-4 flex items-center gap-2">
        <BrainCircuit className="h-5 w-5 text-emerald-700" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-emerald-950">AI 周度定投分析</h2>
      </div>

      <p className="text-sm leading-7 text-emerald-950/74">
        {direction} 本周执行倍率为 {multiplier.toFixed(1)}x。上周 S&P 500 累计涨跌约 {formatPercent(spxTotal)}，NASDAQ 100 累计涨跌约 {formatPercent(ndxTotal)}，周度评分比单日评分更适合作为长期定投节奏参考。
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniStat label="上周SPX" value={formatPercent(spxTotal)} tone={returnClass(spxTotal)} />
        <MiniStat label="上周NDX" value={formatPercent(ndxTotal)} tone={returnClass(ndxTotal)} />
        <MiniStat label="本周倍率" value={`${multiplier.toFixed(1)}x`} tone="text-emerald-800" />
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Gauge;
  tone: "green" | "amber" | "orange" | "red" | { text: string };
}) {
  const textClass = typeof tone === "string" ? toneClass(tone) : tone.text;

  return (
    <div className="risk-glass rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-emerald-900/58">{label}</div>
        <div className="rounded-md border border-emerald-800/12 bg-white/58 p-2">
          <Icon className="h-4 w-4 text-emerald-800" aria-hidden="true" />
        </div>
      </div>
      <div className={`mt-4 font-mono text-3xl font-semibold ${textClass}`}>{value}</div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-emerald-800/12 bg-white/48 px-4 py-3">
      <div className="text-xs text-emerald-900/52">{label}</div>
      <div className={`mt-2 font-mono text-xl font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

interface WeeklyDecision {
  sourceStart: string;
  sourceEnd: string;
  executionStart: string;
  executionEnd: string;
  weeklyScore: number;
  sourceRecords: DailyRiskRecord[];
}

function buildWeeklyDecision(records: DailyRiskRecord[]): WeeklyDecision {
  const latest = records[records.length - 1];

  if (!latest) {
    throw new Error("历史风险数据为空，无法生成周度定投评分。");
  }

  const latestDate = parseDate(latest.date);
  const latestWeekStart = startOfWeek(latestDate);
  const latestDay = latestDate.getUTCDay();
  const scoringWeekStart =
    latestDay === 5 ? latestWeekStart : addDays(latestWeekStart, -7);
  const scoringWeekEnd = addDays(scoringWeekStart, 4);
  const weekEndText = formatDate(scoringWeekEnd);
  const sourceRecords = records
    .filter((record) => record.date <= weekEndText)
    .slice(-5);
  const weeklyScore = Math.round(average(sourceRecords.map((record) => record.riskScore)));
  const executionStart = addDays(scoringWeekEnd, 3);
  const executionEnd = addDays(executionStart, 4);

  return {
    sourceStart: sourceRecords[0]?.date ?? formatDate(scoringWeekStart),
    sourceEnd: sourceRecords[sourceRecords.length - 1]?.date ?? weekEndText,
    executionStart: formatDate(executionStart),
    executionEnd: formatDate(executionEnd),
    weeklyScore,
    sourceRecords,
  };
}

function startOfWeek(date: Date) {
  const day = date.getUTCDay();
  const offset = day === 0 ? 6 : day - 1;

  return addDays(date, -offset);
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);

  return next;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return sum(values) / values.length;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function scoreTone(score: number) {
  if (score < 40) {
    return { text: "text-emerald-700" };
  }

  if (score < 60) {
    return { text: "text-amber-700" };
  }

  if (score < 90) {
    return { text: "text-orange-600" };
  }

  return { text: "text-red-600" };
}

function toneClass(tone: "green" | "amber" | "orange" | "red") {
  if (tone === "green") {
    return "text-emerald-800";
  }

  if (tone === "amber") {
    return "text-amber-700";
  }

  if (tone === "orange") {
    return "text-orange-600";
  }

  return "text-red-600";
}

function returnClass(value: number) {
  return value >= 0 ? "text-emerald-700" : "text-red-600";
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

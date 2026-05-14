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
import snapshotData from "@/public/data/risk-dashboard-latest.json";
import type { RiskDashboardSnapshot } from "@/lib/riskDashboard";

const snapshot = snapshotData as RiskDashboardSnapshot;

interface DailyRiskRecord {
  date: string;
  riskScore: number;
  sentiment: string;
  spxChange: number;
  ndxChange: number;
  vix: number;
  dcaMultiplier: number;
}

export default function HistoryRiskDataPage() {
  const records = generateMockHistory("2026-01-01", snapshot.asOf, snapshot.riskScore);
  const latest = records[0];
  const maxRisk = Math.max(...records.map((record) => record.riskScore));
  const minRisk = Math.min(...records.map((record) => record.riskScore));
  const recent30Average = average(records.slice(0, 30).map((record) => record.riskScore));

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
          <div className="rounded-lg border border-emerald-800/12 bg-white/64 p-4 shadow-[0_18px_50px_rgba(67,96,70,0.09)]">
            <div className="flex items-center gap-2 text-xs text-emerald-900/55">
              <CalendarDays className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              最新完整交易日
            </div>
            <div className="mt-3 font-mono text-2xl font-semibold text-emerald-900">
              {latestDate}
            </div>
          </div>
          <div className="rounded-lg border border-emerald-800/12 bg-white/64 p-4 shadow-[0_18px_50px_rgba(67,96,70,0.09)]">
            <div className="text-xs text-emerald-900/55">记录数量</div>
            <div className="mt-3 font-mono text-2xl font-semibold text-emerald-950">
              {recordsCount}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-emerald-800/12 bg-white/58 px-4 py-3 text-xs leading-5 text-emerald-900/62">
        数据基于美股最近一个交易日收盘后计算。当前页面使用 2026-01-01 起的模拟日度记录，用于先建立完整的历史风险数据库界面。
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
          <thead className="sticky top-0 z-10 bg-[#fffdf6]/98 backdrop-blur-xl">
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

function generateMockHistory(
  startDate: string,
  endDate: string,
  latestRiskScore: number,
): DailyRiskRecord[] {
  const days = getBusinessDays(startDate, endDate);
  const records: DailyRiskRecord[] = [];
  let risk = 48;

  days.forEach((date, index) => {
    const cycle = Math.sin(index / 11) * 8 + Math.sin(index / 29) * 6;
    const shock = deterministicNoise(index, 3) * 7;
    const eventPulse = index > days.length * 0.58 && index < days.length * 0.72 ? 14 : 0;
    risk = clamp(risk * 0.72 + (48 + cycle + shock + eventPulse) * 0.28, 12, 92);

    const pressure = (risk - 50) / 50;
    const riskChange = index === 0 ? 0 : risk - records[records.length - 1].riskScore;
    const spxChange = clamp(
      deterministicNoise(index, 7) * 0.85 - pressure * 0.42 - riskChange * 0.035,
      -3.8,
      3.1,
    );
    const ndxChange = clamp(
      spxChange * 1.18 + deterministicNoise(index, 13) * 0.52 - pressure * 0.18,
      -5.2,
      4.2,
    );
    const vix = clamp(11 + risk * 0.23 + deterministicNoise(index, 19) * 2.6, 11.5, 39.5);
    const riskScore = Math.round(risk);

    records.push({
      date,
      riskScore,
      sentiment: getSentiment(riskScore),
      spxChange: round(spxChange, 2),
      ndxChange: round(ndxChange, 2),
      vix: round(vix, 1),
      dcaMultiplier: getDcaMultiplier(riskScore),
    });
  });

  if (records.length > 0) {
    const last = records[records.length - 1];
    records[records.length - 1] = {
      ...last,
      riskScore: latestRiskScore,
      sentiment: getSentiment(latestRiskScore),
      dcaMultiplier: getDcaMultiplier(latestRiskScore),
      vix: round(clamp(11 + latestRiskScore * 0.23 + deterministicNoise(records.length, 23) * 2.1, 11.5, 39.5), 1),
    };
  }

  return records.reverse();
}

function getBusinessDays(startDate: string, endDate: string) {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  while (current <= end) {
    const day = current.getUTCDay();

    if (day !== 0 && day !== 6) {
      dates.push(current.toISOString().slice(0, 10));
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function getSentiment(score: number) {
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

function getDcaMultiplier(score: number) {
  if (score < 20) {
    return 0.3;
  }

  if (score < 40) {
    return 0.6;
  }

  if (score < 60) {
    return 1;
  }

  if (score < 80) {
    return 1.7;
  }

  return 2.5;
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

function deterministicNoise(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

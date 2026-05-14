import {
  BrainCircuit,
  CalendarClock,
  LockKeyhole,
  Percent,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { DCA_BANDS, getDcaStrategy } from "@/lib/dcaStrategy";

interface DcaStrategyPanelProps {
  riskScore: number;
}

export default function DcaStrategyPanel({ riskScore }: DcaStrategyPanelProps) {
  const strategy = getDcaStrategy(riskScore);

  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-emerald-800/15 bg-[#fffdf6]/90 text-emerald-950 shadow-[0_14px_36px_rgba(67,96,70,0.12)]">
      <div className="border-b border-emerald-800/10 bg-[linear-gradient(135deg,rgba(255,253,246,0.96),rgba(239,250,238,0.9))] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-emerald-800/15 bg-emerald-50/70 px-3 py-1.5 text-xs font-medium text-emerald-800">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              长期指数积累 · 逆向定投
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-normal text-emerald-950 sm:text-3xl">
              动态定投策略系统
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-900/62">
              核心原则：市场越恐慌，长期定投价值越高。系统只用于长期指数投资与分批积累，不用于短线预测。
            </p>
          </div>

          <div className="rounded-lg border border-emerald-800/15 bg-white/64 p-4 shadow-[0_10px_26px_rgba(67,96,70,0.08)]">
            <div className="flex items-center gap-2 text-xs text-emerald-900/55">
              <LockKeyhole className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              风控保护
            </div>
            <div className="mt-2 text-2xl font-semibold text-emerald-800">
              最高 {strategy.maxMultiplier.toFixed(0)}x
            </div>
            <p className="mt-2 max-w-xs text-xs leading-5 text-emerald-900/55">
              定投倍率设置上限，避免无限放大投入，不鼓励满仓或杠杆化行为。
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <DcaMetric label="当前市场状态" value={strategy.state} tone="orange" />
            <DcaMetric label="当前标准化风险评分" value={`${strategy.riskScore}`} tone="orange" />
            <DcaMetric
              label="当前定投倍率"
              value={`${strategy.multiplier.toFixed(1)}x`}
              tone="green"
            />
          </div>

          <div className="rounded-lg border border-emerald-800/12 bg-white/62 p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-950">
                <CalendarClock className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                当前建议
              </div>
              <div className="text-xs text-emerald-900/55">
                执行口径：以个人长期计划为基准
              </div>
            </div>
            <p className="text-base leading-7 text-emerald-950/82">{strategy.description}</p>
            <div className="mt-4 rounded-md border border-emerald-800/14 bg-emerald-50/70 px-3 py-2 text-sm font-medium text-emerald-800">
              {strategy.advice}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-800/12 bg-white/62 p-4">
            <div className="mb-3 flex items-center justify-between text-xs text-emerald-900/55">
              <span>定投风险温度条</span>
              <span>{strategy.riskScore}/100</span>
            </div>
            <div className="relative h-4 rounded-full bg-emerald-100/70 p-1">
              <div
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, #34d399 0%, #a3e635 22%, #fde047 48%, #fb923c 72%, #ef4444 100%)",
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${strategy.riskScore}%` }}
              >
                <div className="-ml-3 h-6 w-6 rounded-full border border-white bg-[#fb923c] shadow-[0_0_14px_rgba(251,146,60,0.3)]" />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] text-emerald-900/52 sm:grid-cols-6 sm:text-xs">
              {DCA_BANDS.map((band) => (
                <div key={band.state} className="min-w-0">
                  <div className="truncate text-emerald-950">{band.state}</div>
                  <div className="mt-1">{band.multiplier.toFixed(1)}x</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-emerald-800/12 bg-white/62 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-950">
              <Percent className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              定投倍率映射表
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-emerald-800/12">
              <div className="grid grid-cols-[0.85fr_1fr_0.8fr] bg-emerald-50/72 px-3 py-2 text-xs text-emerald-900/55">
                <div>风险区间</div>
                <div>市场状态</div>
                <div>倍率</div>
              </div>
              {DCA_BANDS.map((band) => (
                <div
                  key={band.state}
                  className="grid grid-cols-[0.85fr_1fr_0.8fr] border-t border-emerald-800/10 px-3 py-2 text-sm"
                >
                  <div className="font-mono text-emerald-900/62">
                    {band.min}-{band.max}
                  </div>
                  <div className="font-medium text-emerald-950">{band.state}</div>
                  <div className="font-semibold text-emerald-800">
                    {band.multiplier.toFixed(1)}x
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-800/12 bg-[linear-gradient(180deg,rgba(255,253,246,0.92),rgba(239,250,238,0.8))] p-4 shadow-[0_12px_30px_rgba(34,197,94,0.05)]">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-950">
              <BrainCircuit className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              智能策略解释
            </div>
            <p className="mt-4 text-sm leading-7 text-emerald-950/78">
              当前市场情绪偏向{strategy.state}，系统建议按长期纪律调整定投力度。该模块强调逆向积累、分批执行与现金流稳定，而不是短线择时。
            </p>
            <div className="mt-4 flex items-start gap-2 rounded-md border border-emerald-800/14 bg-emerald-50/70 px-3 py-2 text-xs leading-5 text-emerald-800">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              该模块服务于长期指数投资，不构成短线交易信号，也不建议使用杠杆或一次性满仓。
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DcaMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "orange";
}) {
  const color = tone === "green" ? "text-emerald-800" : "text-orange-700";

  return (
    <div className="rounded-lg border border-emerald-800/12 bg-white/62 p-4">
      <div className="text-xs text-emerald-900/55">{label}</div>
      <div className={`mt-3 text-2xl font-semibold tracking-normal ${color}`}>
        {value}
      </div>
    </div>
  );
}

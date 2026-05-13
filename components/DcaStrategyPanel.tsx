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
    <section className="mt-6 overflow-hidden rounded-lg border border-[#164e3a]/70 bg-[#06120d] text-[#e8fff2] shadow-[0_28px_90px_rgba(5,40,26,0.28)]">
      <div className="border-b border-[#1f513c] bg-[linear-gradient(135deg,rgba(6,18,13,0.98),rgba(7,36,25,0.94))] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-[#2f7b58] bg-[#0c2419] px-3 py-1.5 text-xs font-medium text-[#a7f3d0]">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              长期指数积累 · 逆向定投
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-normal text-[#f7fff9] sm:text-3xl">
              动态定投策略系统
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#9db7a8]">
              核心原则：市场越恐慌，长期定投价值越高。系统只用于长期指数投资与分批积累，不用于短线预测。
            </p>
          </div>

          <div className="rounded-lg border border-[#2f7b58] bg-[#0a1d14] p-4">
            <div className="flex items-center gap-2 text-xs text-[#9db7a8]">
              <LockKeyhole className="h-4 w-4 text-[#86efac]" aria-hidden="true" />
              风控保护
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#bbf7d0]">
              最高 {strategy.maxMultiplier.toFixed(0)}x
            </div>
            <p className="mt-2 max-w-xs text-xs leading-5 text-[#8aa595]">
              定投倍率设置上限，避免无限放大投入，不鼓励满仓或杠杆化行为。
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <DcaMetric label="当前市场状态" value={strategy.state} tone="orange" />
            <DcaMetric label="当前风险评分" value={`${strategy.riskScore}`} tone="orange" />
            <DcaMetric
              label="当前定投倍率"
              value={`${strategy.multiplier.toFixed(1)}x`}
              tone="green"
            />
          </div>

          <div className="rounded-lg border border-[#1f513c] bg-[#0a1d14] p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-[#e8fff2]">
                <CalendarClock className="h-4 w-4 text-[#86efac]" aria-hidden="true" />
                当前建议
              </div>
              <div className="text-xs text-[#8aa595]">
                执行口径：以个人长期计划为基准
              </div>
            </div>
            <p className="text-base leading-7 text-[#dffdea]">{strategy.description}</p>
            <div className="mt-4 rounded-md border border-[#2f7b58] bg-[#102d20] px-3 py-2 text-sm font-medium text-[#bbf7d0]">
              {strategy.advice}
            </div>
          </div>

          <div className="rounded-lg border border-[#1f513c] bg-[#0a1d14] p-4">
            <div className="mb-3 flex items-center justify-between text-xs text-[#8aa595]">
              <span>定投风险温度条</span>
              <span>{strategy.riskScore}/100</span>
            </div>
            <div className="relative h-4 rounded-full bg-[#13281d] p-1">
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
                <div className="-ml-3 h-6 w-6 rounded-full border border-[#fff7ed] bg-[#fb923c] shadow-[0_0_26px_rgba(251,146,60,0.72)]" />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2 text-center text-[10px] text-[#8aa595] sm:text-xs">
              {DCA_BANDS.map((band) => (
                <div key={band.state} className="min-w-0">
                  <div className="truncate text-[#dffdea]">{band.state}</div>
                  <div className="mt-1">{band.multiplier.toFixed(1)}x</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-[#1f513c] bg-[#0a1d14] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#e8fff2]">
              <Percent className="h-4 w-4 text-[#86efac]" aria-hidden="true" />
              定投倍率映射表
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-[#1f513c]">
              <div className="grid grid-cols-[0.85fr_1fr_0.8fr] bg-[#102d20] px-3 py-2 text-xs text-[#8aa595]">
                <div>风险区间</div>
                <div>市场状态</div>
                <div>倍率</div>
              </div>
              {DCA_BANDS.map((band) => (
                <div
                  key={band.state}
                  className="grid grid-cols-[0.85fr_1fr_0.8fr] border-t border-[#1f513c] px-3 py-2 text-sm"
                >
                  <div className="font-mono text-[#b7d5c3]">
                    {band.min}-{band.max}
                  </div>
                  <div className="font-medium text-[#e8fff2]">{band.state}</div>
                  <div className="font-semibold text-[#bbf7d0]">
                    {band.multiplier.toFixed(1)}x
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#1f513c] bg-[linear-gradient(180deg,rgba(12,36,25,0.94),rgba(7,22,15,0.98))] p-4 shadow-[0_0_44px_rgba(34,197,94,0.08)]">
            <div className="flex items-center gap-2 text-sm font-medium text-[#e8fff2]">
              <BrainCircuit className="h-4 w-4 text-[#86efac]" aria-hidden="true" />
              智能策略解释
            </div>
            <p className="mt-4 text-sm leading-7 text-[#dffdea]">
              当前市场情绪偏向{strategy.state}，系统建议按长期纪律调整定投力度。该模块强调逆向积累、分批执行与现金流稳定，而不是短线择时。
            </p>
            <div className="mt-4 flex items-start gap-2 rounded-md border border-[#2f7b58] bg-[#102d20] px-3 py-2 text-xs leading-5 text-[#a7f3d0]">
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
  const color = tone === "green" ? "text-[#bbf7d0]" : "text-[#fdba74]";

  return (
    <div className="rounded-lg border border-[#1f513c] bg-[#0a1d14] p-4">
      <div className="text-xs text-[#8aa595]">{label}</div>
      <div className={`mt-3 text-2xl font-semibold tracking-normal ${color}`}>
        {value}
      </div>
    </div>
  );
}

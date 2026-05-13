"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  CheckCircle2,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { getDcaStrategy } from "@/lib/dcaStrategy";
import {
  formatSigned,
  getRiskLevel,
  getRiskPosture,
  normalizeWeightedZ,
  type RiskDashboardFactor,
  type RiskDashboardSnapshot,
} from "@/lib/riskDashboard";

interface ManualRiskOverridePanelProps {
  snapshot: RiskDashboardSnapshot;
}

type ManualInputs = Record<string, string>;

export default function ManualRiskOverridePanel({
  snapshot,
}: ManualRiskOverridePanelProps) {
  const initialInputs = useMemo(() => buildInitialInputs(snapshot.factors), [snapshot.factors]);
  const [draftInputs, setDraftInputs] = useState<ManualInputs>(initialInputs);
  const [appliedInputs, setAppliedInputs] = useState<ManualInputs>(initialInputs);
  const hasPendingChanges = !areInputsEqual(draftInputs, appliedInputs);

  const result = useMemo(() => {
    const factors = snapshot.factors.map((factor) => {
      const rawValue = parseInput(appliedInputs[factor.id], factor.rawValue);
      const riskValue = toRiskValue(factor.id, rawValue);
      const riskBenchmark = Number.isFinite(factor.riskBenchmarkValue)
        ? factor.riskBenchmarkValue
        : toRiskValue(factor.id, factor.benchmarkValue);
      const riskStdDev =
        Number.isFinite(factor.riskStdDev) && factor.riskStdDev > 0
          ? factor.riskStdDev
          : Math.max(Math.abs(factor.rawStdDev), 0.0001);
      const zScore = (riskValue - riskBenchmark) / riskStdDev;

      return {
        ...factor,
        manualRawValue: rawValue,
        manualZScore: zScore,
        manualContribution: factor.weight * zScore,
      };
    });
    const weightedZ = factors.reduce((sum, factor) => sum + factor.manualContribution, 0);
    const riskScore = normalizeWeightedZ(weightedZ);
    const riskLevel = getRiskLevel(riskScore);
    const dca = getDcaStrategy(riskScore);

    return {
      factors,
      weightedZ,
      riskScore,
      riskLevel,
      posture: getRiskPosture(riskScore),
      dcaMultiplier: dca.multiplier,
    };
  }, [appliedInputs, snapshot.factors]);

  function updateInput(id: string, value: string) {
    setDraftInputs((current) => ({
      ...current,
      [id]: value,
    }));
  }

  function applyInputs() {
    setAppliedInputs(draftInputs);
  }

  function resetInputs() {
    setDraftInputs(initialInputs);
    setAppliedInputs(initialInputs);
  }

  return (
    <section className="risk-glass mt-6 overflow-hidden rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-emerald-600/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-emerald-800">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            手动校准台
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-normal text-white">
            手动输入最新指标并确认重算
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            官方模型默认使用上一交易日收盘数据。你也可以把自己查到的最新值填入下方入口，点击确认后在当前浏览器内重算新的 Z 值、市场温度和定投倍率。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
          <ManualResultCard label="手动风险评分" value={`${result.riskScore} / 100`} tone="orange" />
          <ManualResultCard label="手动市场状态" value={result.riskLevel} tone="green" />
          <ManualResultCard
            label="手动定投倍率"
            value={`${result.dcaMultiplier.toFixed(1)}x`}
            tone="green"
          />
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
            <Calculator className="h-4 w-4 text-cyan-300" aria-hidden="true" />
            已应用测算结果
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {hasPendingChanges ? (
              <span className="rounded-md border border-orange-300/30 bg-orange-300/10 px-3 py-2 text-xs font-medium text-orange-200">
                有未应用更改
              </span>
            ) : (
              <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-200">
                当前结果已应用
              </span>
            )}
            <button
              type="button"
              onClick={applyInputs}
              disabled={!hasPendingChanges}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-700/20 bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              确认更改并重算
            </button>
            <button
              type="button"
              onClick={resetInputs}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-700/20 bg-white/70 px-3 py-2 text-xs font-medium text-emerald-900 transition hover:bg-emerald-50"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              恢复官方收盘值
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-xs text-slate-500">手动加权 Z 值</div>
            <div className="mt-2 font-mono text-2xl font-semibold text-cyan-300">
              {formatSigned(result.weightedZ)}
            </div>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-xs text-slate-500">风险姿态</div>
            <div className="mt-2 text-2xl font-semibold text-orange-300">
              {result.posture}
            </div>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-xs text-slate-500">计算口径</div>
            <div className="mt-2 text-sm leading-6 text-slate-300">
              只做本机临时测算，不覆盖每日自动数据。
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        {result.factors.map((factor) => (
          <ManualInputCard
            key={factor.id}
            factor={factor}
            value={draftInputs[factor.id] ?? ""}
            onChange={(value) => updateInput(factor.id, value)}
          />
        ))}
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-xs leading-5 text-slate-500">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
        <span>
          手动校准适合盘中观察或你自行补录最新数据；长期公开页面仍以每日自动抓取的上一交易日收盘数据为准，保证可追踪、可复现、可回测。
        </span>
      </div>
    </section>
  );
}

function ManualInputCard({
  factor,
  value,
  onChange,
}: {
  factor: RiskDashboardFactor & {
    manualRawValue: number;
    manualZScore: number;
    manualContribution: number;
  };
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
      <div className="text-sm font-semibold text-slate-100">{factor.name}</div>
      <div className="mt-1 text-xs text-slate-500">{factor.manualLabel}</div>

      <label className="mt-4 block text-xs text-slate-500" htmlFor={`manual-${factor.id}`}>
        手动值{factor.manualUnit ? `（${factor.manualUnit}）` : ""}
      </label>
      <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-800 bg-white/70 px-3 py-2">
        <input
          id={`manual-${factor.id}`}
          type="number"
          inputMode="decimal"
          step={factor.manualStep}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent font-mono text-base font-semibold text-emerald-950 outline-none"
        />
        {factor.manualUnit ? (
          <span className="text-xs font-medium text-slate-500">{factor.manualUnit}</span>
        ) : null}
      </div>

      <div className="mt-4 space-y-2 text-xs">
        <InfoRow label="官方收盘值" value={factor.rawDisplay} />
        <InfoRow label={factor.benchmarkLabel} value={factor.benchmarkDisplay} />
        <InfoRow label="手动 Z 值" value={formatSigned(factor.manualZScore)} />
        <InfoRow label="贡献" value={formatSigned(factor.manualContribution)} />
      </div>
    </div>
  );
}

function ManualResultCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "orange";
}) {
  const color = tone === "green" ? "text-emerald-300" : "text-orange-300";

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.14)]">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-3 text-2xl font-semibold tracking-normal ${color}`}>
        {value}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono font-medium text-slate-100">{value}</span>
    </div>
  );
}

function buildInitialInputs(factors: RiskDashboardFactor[]) {
  return Object.fromEntries(
    factors.map((factor) => [factor.id, String(factor.rawValue)]),
  );
}

function areInputsEqual(a: ManualInputs, b: ManualInputs) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of keys) {
    if ((a[key] ?? "") !== (b[key] ?? "")) {
      return false;
    }
  }

  return true;
}

function parseInput(value: string, fallback: number) {
  const parsed = Number(value.replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : fallback;
}

function toRiskValue(id: RiskDashboardFactor["id"], rawValue: number) {
  if (id === "yieldCurve" || id === "trend" || id === "momentum") {
    return -rawValue;
  }

  return rawValue;
}

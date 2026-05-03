import clsx from "clsx";
import StatusBadge from "@/components/StatusBadge";
import type { StatusLevel } from "@/lib/types";

interface MetricCardProps {
  title: string;
  value: string;
  detail?: string;
  subValue?: string;
  footer?: string;
  badge?: string;
  badgeLevel?: StatusLevel;
  tone?: StatusLevel;
}

const toneStyles: Record<StatusLevel, string> = {
  positive: "border-emerald-200",
  neutral: "border-slate-200",
  warning: "border-amber-200",
  danger: "border-rose-200",
  info: "border-sky-200",
  manual: "border-violet-200",
  stale: "border-zinc-200",
};

export default function MetricCard({
  title,
  value,
  detail,
  subValue,
  footer,
  badge,
  badgeLevel = "neutral",
  tone = "neutral",
}: MetricCardProps) {
  return (
    <section
      className={clsx(
        "min-h-40 rounded-lg border bg-white p-5 shadow-panel",
        toneStyles[tone],
      )}
    >
      <div className="flex min-h-7 items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        {badge ? <StatusBadge label={badge} level={badgeLevel} /> : null}
      </div>
      <div className="mt-5 text-3xl font-semibold tracking-normal text-ink">
        {value}
      </div>
      {subValue ? (
        <div className="mt-2 text-sm font-medium text-slate-700">{subValue}</div>
      ) : null}
      {detail ? <p className="mt-3 text-sm leading-6 text-slate-500">{detail}</p> : null}
      {footer ? (
        <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

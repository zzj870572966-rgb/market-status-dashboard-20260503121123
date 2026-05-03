import clsx from "clsx";
import type { StatusLevel } from "@/lib/types";

interface StatusBadgeProps {
  label: string;
  level?: StatusLevel;
}

const styles: Record<StatusLevel, string> = {
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  manual: "border-violet-200 bg-violet-50 text-violet-700",
  stale: "border-zinc-200 bg-zinc-50 text-zinc-600",
};

export default function StatusBadge({
  label,
  level = "neutral",
}: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
        styles[level],
      )}
    >
      {label}
    </span>
  );
}

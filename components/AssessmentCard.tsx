import { AlertTriangle, CheckCircle2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import type { MarketAssessment, StatusLevel } from "@/lib/types";

interface AssessmentCardProps {
  assessment: MarketAssessment;
  isPartial?: boolean;
  partialMessage?: string;
  level?: StatusLevel;
}

export default function AssessmentCard({
  assessment,
  isPartial = false,
  partialMessage,
  level = "neutral",
}: AssessmentCardProps) {
  const Icon = isPartial ? AlertTriangle : CheckCircle2;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Icon
              aria-hidden="true"
              className={isPartial ? "h-5 w-5 text-amber-600" : "h-5 w-5 text-emerald-600"}
            />
            <h2 className="text-lg font-semibold text-ink">{assessment.title}</h2>
          </div>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
            {assessment.summary}
          </p>
        </div>
        <StatusBadge label={assessment.riskLevel} level={level} />
      </div>

      {isPartial ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          {partialMessage || "部分数据暂未更新，当前页面已沿用最近一次成功数据。"}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {assessment.bullets.map((item) => (
          <div
            key={item}
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
          >
            {item}
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4 text-sm font-medium text-slate-800">
        {assessment.action}
      </div>
    </section>
  );
}

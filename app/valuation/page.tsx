import AssessmentCard from "@/components/AssessmentCard";
import MetricCard from "@/components/MetricCard";
import StatusBadge from "@/components/StatusBadge";
import { getMarketData } from "@/lib/data";
import { describePartialSources, formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-static";

export default async function ValuationPage() {
  const data = await getMarketData();
  const valuation = data.valuation;
  const pe = valuation.sp500PE;
  const cape = valuation.cape;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">估值</h2>
          <p className="mt-2 text-sm text-slate-500">手动数据日期：{formatDate(valuation.date)}</p>
        </div>
        <StatusBadge label="手动维护" level="manual" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="S&P 500 P/E"
          value={formatNumber(pe.value)}
          badge="手动"
          badgeLevel="manual"
          tone={pe.value && pe.value >= 25 ? "warning" : "neutral"}
          detail={`数据日期：${formatDate(pe.date)}`}
        />
        <MetricCard
          title="CAPE"
          value={formatNumber(cape.value)}
          badge="手动"
          badgeLevel="manual"
          tone={cape.value && cape.value >= 35 ? "warning" : "neutral"}
          detail={`数据日期：${formatDate(cape.date)}`}
        />
        <MetricCard
          title="估值解读"
          value={data.score.label}
          badge={`${data.score.value}/100`}
          badgeLevel={data.score.level}
          tone={data.score.level}
          detail={valuation.summary}
        />
      </div>

      <AssessmentCard
        assessment={data.assessment}
        isPartial={data.status.isPartial}
        partialMessage={describePartialSources(data.status.sources) || data.status.message}
        level={data.score.level}
      />
    </div>
  );
}

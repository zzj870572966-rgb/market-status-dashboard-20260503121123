import AssessmentCard from "@/components/AssessmentCard";
import MetricCard from "@/components/MetricCard";
import StatusBadge from "@/components/StatusBadge";
import { buildOptionsAssessment } from "@/lib/categoryAssessments";
import { getMarketData } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import type { StatusLevel } from "@/lib/types";

export const dynamic = "force-static";

export default async function OptionsPage() {
  const data = await getMarketData();
  const options = data.optionsStructure;
  const gammaLevel = gammaStatusToLevel(options.spxNetGamma.status);
  const optionsAssessment = buildOptionsAssessment(data);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">期权结构</h2>
          <p className="mt-2 text-sm text-slate-500">
            第一版为手动录入，数据日期：{formatDate(options.date)}
          </p>
        </div>
        <StatusBadge label="手动维护" level="manual" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="SPX Net Gamma 状态"
          value={options.spxNetGamma.label}
          badge="手动"
          badgeLevel="manual"
          tone={gammaLevel}
          detail={options.spxNetGamma.description}
        />
        <MetricCard
          title="SPX Zero Gamma"
          value={formatNumber(options.spxZeroGamma.value)}
          badge="手动"
          badgeLevel="manual"
          tone="neutral"
          detail={`数据日期：${formatDate(options.spxZeroGamma.date)}`}
        />
        <MetricCard
          title="SPX Put Wall"
          value={formatNumber(options.spxPutWall.value)}
          badge="手动"
          badgeLevel="manual"
          tone="warning"
          detail={`数据日期：${formatDate(options.spxPutWall.date)}`}
        />
        <MetricCard
          title="SPX Call Wall"
          value={formatNumber(options.spxCallWall.value)}
          badge="手动"
          badgeLevel="manual"
          tone="positive"
          detail={`数据日期：${formatDate(options.spxCallWall.date)}`}
        />
        <MetricCard
          title="NDX / QQQ Put Wall"
          value={options.ndxQqqPutWall}
          badge="手动"
          badgeLevel="manual"
          tone="warning"
          detail="第一版不自动计算 Gamma，仅显示手动 JSON。"
        />
        <MetricCard
          title="NDX / QQQ Call Wall"
          value={options.ndxQqqCallWall}
          badge="手动"
          badgeLevel="manual"
          tone="positive"
          detail="可在 src/data/manual/options-structure.json 中维护。"
        />
      </div>

      <AssessmentCard
        assessment={optionsAssessment.assessment}
        level={optionsAssessment.level}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink">今日期权结构解读</h3>
          <StatusBadge label={options.spxNetGamma.label} level={gammaLevel} />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{options.interpretation}</p>
      </section>
    </div>
  );
}

function gammaStatusToLevel(status: "positive" | "neutral" | "negative"): StatusLevel {
  if (status === "positive") {
    return "positive";
  }

  if (status === "negative") {
    return "warning";
  }

  return "neutral";
}

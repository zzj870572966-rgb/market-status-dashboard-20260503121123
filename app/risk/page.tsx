import AssessmentCard from "@/components/AssessmentCard";
import HistoryLineChart from "@/components/HistoryLineChart";
import MetricCard from "@/components/MetricCard";
import StatusBadge from "@/components/StatusBadge";
import { buildRiskAssessment } from "@/lib/categoryAssessments";
import { getHistoryIndex, getMarketData } from "@/lib/data";
import { describePartialSources, formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-static";

export default async function RiskPage() {
  const [data, history] = await Promise.all([getMarketData(), getHistoryIndex()]);
  const vix = data.volatility.vix;
  const vxn = data.volatility.vxn;
  const curve = data.rates.yieldCurve2s10s;
  const gamma = data.optionsStructure.spxNetGamma;
  const riskAssessment = buildRiskAssessment(data);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">风险</h2>
          <p className="mt-2 text-sm text-slate-500">数据日期：{formatDate(data.asOf)}</p>
        </div>
        <StatusBadge label={data.score.label} level={data.score.level} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="市场状态评分"
          value={`${data.score.value}/100`}
          badge={data.score.label}
          badgeLevel={data.score.level}
          tone={data.score.level}
          detail={data.score.drivers[0]}
        />
        <MetricCard
          title="VIX"
          value={formatNumber(vix.value)}
          badge={vix.stale ? "沿用旧值" : "FRED"}
          badgeLevel={vix.stale ? "stale" : vix.value && vix.value >= 25 ? "warning" : "neutral"}
          tone={vix.value && vix.value >= 25 ? "warning" : "neutral"}
          detail={`数据日期：${formatDate(vix.date)}`}
        />
        <MetricCard
          title="VXN"
          value={formatNumber(vxn.value)}
          badge={vxn.stale ? "沿用旧值" : "FRED"}
          badgeLevel={vxn.stale ? "stale" : vxn.value && vxn.value >= 35 ? "warning" : "neutral"}
          tone={vxn.value && vxn.value >= 35 ? "warning" : "neutral"}
          detail={`数据日期：${formatDate(vxn.date)}`}
        />
        <MetricCard
          title="2Y/10Y 利差"
          value={`${formatNumber(curve.value)} bp`}
          badge={curve.value && curve.value < 0 ? "倒挂" : "正常"}
          badgeLevel={curve.value && curve.value < 0 ? "warning" : "neutral"}
          tone={curve.value && curve.value < 0 ? "warning" : "neutral"}
          detail={`期权 Gamma：${gamma.label}`}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">VIX 历史</h2>
        <HistoryLineChart items={history.items} dataKey="vix" label="VIX" color="#dc2626" />
      </section>

      <AssessmentCard
        assessment={riskAssessment.assessment}
        isPartial={data.status.isPartial}
        partialMessage={describePartialSources(data.status.sources) || data.status.message}
        level={riskAssessment.level}
      />
    </div>
  );
}

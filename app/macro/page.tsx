import AssessmentCard from "@/components/AssessmentCard";
import MetricCard from "@/components/MetricCard";
import StatusBadge from "@/components/StatusBadge";
import { getMarketData } from "@/lib/data";
import {
  describePartialSources,
  formatDate,
  formatNumber,
  formatPercent,
  statusFromChange,
} from "@/lib/format";

export const dynamic = "force-static";

export default async function MacroPage() {
  const data = await getMarketData();
  const us10y = data.rates.us10y;
  const us2y = data.rates.us2y;
  const curve = data.rates.yieldCurve2s10s;
  const spx = data.indices.sp500;
  const ndx = data.indices.nasdaq100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">宏观</h2>
          <p className="mt-2 text-sm text-slate-500">数据日期：{formatDate(data.asOf)}</p>
        </div>
        <StatusBadge
          label={data.status.isPartial ? "部分数据暂未更新" : "数据已更新"}
          level={data.status.isPartial ? "warning" : "positive"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="10Y 美债收益率"
          value={`${formatNumber(us10y.value)}%`}
          badge={us10y.stale ? "沿用旧值" : "FRED"}
          badgeLevel={us10y.stale ? "stale" : "neutral"}
          tone="neutral"
          detail={`数据日期：${formatDate(us10y.date)}`}
        />
        <MetricCard
          title="2Y 美债收益率"
          value={`${formatNumber(us2y.value)}%`}
          badge={us2y.stale ? "沿用旧值" : "FRED"}
          badgeLevel={us2y.stale ? "stale" : "neutral"}
          tone="neutral"
          detail={`数据日期：${formatDate(us2y.date)}`}
        />
        <MetricCard
          title="2Y/10Y 利差"
          value={`${formatNumber(curve.value)} bp`}
          badge={curve.value && curve.value < 0 ? "倒挂" : "正斜率"}
          badgeLevel={curve.value && curve.value < 0 ? "warning" : "neutral"}
          tone={curve.value && curve.value < 0 ? "warning" : "neutral"}
          detail="使用 FRED DGS10 - DGS2 计算。"
        />
        <MetricCard
          title="宏观风险映射"
          value={data.score.label}
          badge={`${data.score.value}/100`}
          badgeLevel={data.score.level}
          tone={data.score.level}
          detail={data.score.drivers.find((item) => item.includes("利差")) || data.assessment.action}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          title="S&P 500"
          value={formatNumber(spx.value)}
          subValue={formatPercent(spx.changePercent)}
          badge={spx.stale ? "沿用旧值" : "Stooq"}
          badgeLevel={spx.stale ? "stale" : statusFromChange(spx.changePercent)}
          tone={statusFromChange(spx.changePercent)}
          detail={`收盘日期：${formatDate(spx.date)}`}
        />
        <MetricCard
          title="Nasdaq 100"
          value={formatNumber(ndx.value)}
          subValue={formatPercent(ndx.changePercent)}
          badge={ndx.stale ? "沿用旧值" : "Stooq"}
          badgeLevel={ndx.stale ? "stale" : statusFromChange(ndx.changePercent)}
          tone={statusFromChange(ndx.changePercent)}
          detail={`收盘日期：${formatDate(ndx.date)}`}
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

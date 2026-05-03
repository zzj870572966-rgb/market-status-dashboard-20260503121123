import AssessmentCard from "@/components/AssessmentCard";
import HistoryLineChart from "@/components/HistoryLineChart";
import MetricCard from "@/components/MetricCard";
import StatusBadge from "@/components/StatusBadge";
import { getHistoryIndex, getMarketData } from "@/lib/data";
import {
  describePartialSources,
  formatDate,
  formatNumber,
  formatPercent,
  statusFromChange,
} from "@/lib/format";

export const dynamic = "force-static";

export default async function OverviewPage() {
  const [data, history] = await Promise.all([getMarketData(), getHistoryIndex()]);
  const partialMessage = describePartialSources(data.status.sources);
  const spx = data.indices.sp500;
  const ndx = data.indices.nasdaq100;
  const vix = data.volatility.vix;
  const cnn = data.sentiment.cnnFearGreed;
  const crypto = data.sentiment.cryptoFearGreed;
  const valuation = data.valuation;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">总览</h2>
          <p className="mt-2 text-sm text-slate-500">
            数据日期：{formatDate(data.asOf)}，生成时间：{data.generatedAt.slice(0, 10)}
          </p>
        </div>
        <StatusBadge
          label={data.status.isPartial ? "部分数据暂未更新" : "数据已更新"}
          level={data.status.isPartial ? "warning" : "positive"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="市场状态评分"
          value={`${data.score.value}/100`}
          subValue={data.score.label}
          badge={data.score.label}
          badgeLevel={data.score.level}
          tone={data.score.level}
          detail={data.score.drivers[0] || "等待更多历史数据形成趋势。"}
        />
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
        <MetricCard
          title="VIX"
          value={formatNumber(vix.value)}
          subValue={formatPercent(vix.change)}
          badge={vix.stale ? "沿用旧值" : "FRED"}
          badgeLevel={vix.stale ? "stale" : vix.value && vix.value >= 25 ? "warning" : "neutral"}
          tone={vix.value && vix.value >= 25 ? "warning" : "neutral"}
          detail={`VXN：${formatNumber(data.volatility.vxn.value)}，日期：${formatDate(vix.date)}`}
        />
        <MetricCard
          title="情绪温度"
          value={formatNumber(cnn.value)}
          subValue={`CNN：${cnn.classification || "N/A"}`}
          badge={cnn.stale ? "沿用旧值" : "手动"}
          badgeLevel={cnn.stale ? "stale" : "manual"}
          tone="info"
          detail={`Crypto Fear & Greed：${formatNumber(crypto.value)} (${crypto.classification || "N/A"})`}
        />
        <MetricCard
          title="估值水平"
          value={`P/E ${formatNumber(valuation.sp500PE.value)}`}
          subValue={`CAPE ${formatNumber(valuation.cape.value)}`}
          badge="手动"
          badgeLevel="manual"
          tone={
            valuation.cape.value && valuation.cape.value >= 35
              ? "warning"
              : "neutral"
          }
          detail={valuation.summary}
        />
      </div>

      <AssessmentCard
        assessment={data.assessment}
        isPartial={data.status.isPartial}
        partialMessage={partialMessage || data.status.message}
        level={data.score.level}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">历史评分</h2>
        <HistoryLineChart
          items={history.items}
          dataKey="score"
          label="市场状态评分"
          color="#2563eb"
        />
      </section>
    </div>
  );
}

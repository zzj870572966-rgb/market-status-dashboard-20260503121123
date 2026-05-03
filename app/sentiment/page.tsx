import AssessmentCard from "@/components/AssessmentCard";
import MetricCard from "@/components/MetricCard";
import StatusBadge from "@/components/StatusBadge";
import { getMarketData } from "@/lib/data";
import { describePartialSources, formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-static";

export default async function SentimentPage() {
  const data = await getMarketData();
  const cnn = data.sentiment.cnnFearGreed;
  const crypto = data.sentiment.cryptoFearGreed;
  const vix = data.volatility.vix;
  const vxn = data.volatility.vxn;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">情绪</h2>
          <p className="mt-2 text-sm text-slate-500">数据日期：{formatDate(data.asOf)}</p>
        </div>
        <StatusBadge
          label={data.status.isPartial ? "部分数据暂未更新" : "数据已更新"}
          level={data.status.isPartial ? "warning" : "positive"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="CNN Fear & Greed"
          value={formatNumber(cnn.value)}
          subValue={cnn.classification}
          badge={cnn.stale ? "沿用旧值" : "手动"}
          badgeLevel={cnn.stale ? "stale" : "manual"}
          tone="info"
          detail={`手动数据日期：${formatDate(cnn.date)}`}
        />
        <MetricCard
          title="Crypto Fear & Greed"
          value={formatNumber(crypto.value)}
          subValue={crypto.classification}
          badge={crypto.stale ? "沿用旧值" : "Alternative.me"}
          badgeLevel={crypto.stale ? "stale" : "neutral"}
          tone={crypto.value && crypto.value >= 75 ? "warning" : "neutral"}
          detail={`数据日期：${formatDate(crypto.date)}`}
        />
        <MetricCard
          title="VIX"
          value={formatNumber(vix.value)}
          subValue={vix.value && vix.value >= 25 ? "波动警戒" : "波动可控"}
          badge={vix.stale ? "沿用旧值" : "FRED"}
          badgeLevel={vix.stale ? "stale" : vix.value && vix.value >= 25 ? "warning" : "neutral"}
          tone={vix.value && vix.value >= 25 ? "warning" : "neutral"}
          detail={`数据日期：${formatDate(vix.date)}`}
        />
        <MetricCard
          title="VXN"
          value={formatNumber(vxn.value)}
          subValue={vxn.value && vxn.value >= 35 ? "科技波动偏高" : "科技波动温和"}
          badge={vxn.stale ? "沿用旧值" : "FRED"}
          badgeLevel={vxn.stale ? "stale" : vxn.value && vxn.value >= 35 ? "warning" : "neutral"}
          tone={vxn.value && vxn.value >= 35 ? "warning" : "neutral"}
          detail={`数据日期：${formatDate(vxn.date)}`}
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

import AssessmentCard from "@/components/AssessmentCard";
import MetricCard from "@/components/MetricCard";
import StatusBadge from "@/components/StatusBadge";
import { getMarketData } from "@/lib/data";
import { describePartialSources, formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-static";

export default async function CryptoPage() {
  const data = await getMarketData();
  const crypto = data.sentiment.cryptoFearGreed;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">加密</h2>
          <p className="mt-2 text-sm text-slate-500">数据日期：{formatDate(crypto.date)}</p>
        </div>
        <StatusBadge
          label={crypto.stale ? "沿用旧值" : "Alternative.me"}
          level={crypto.stale ? "stale" : "neutral"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Crypto Fear & Greed"
          value={formatNumber(crypto.value)}
          subValue={crypto.classification}
          badge={crypto.stale ? "沿用旧值" : "已更新"}
          badgeLevel={crypto.stale ? "stale" : "positive"}
          tone={crypto.value && crypto.value >= 75 ? "warning" : "neutral"}
          detail={`来源：${crypto.source}`}
        />
        <MetricCard
          title="市场评分影响"
          value={data.score.label}
          badge={`${data.score.value}/100`}
          badgeLevel={data.score.level}
          tone={data.score.level}
          detail={
            data.score.drivers.find((item) => item.includes("Crypto")) ||
            "加密情绪没有给出极端信号。"
          }
        />
        <MetricCard
          title="定投动作"
          value={data.assessment.action}
          badge={data.assessment.riskLevel}
          badgeLevel={data.score.level}
          tone={data.score.level}
          detail="加密情绪只作为风险偏好辅助指标，不作为实时交易信号。"
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

"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryIndexItem } from "@/lib/types";

interface HistoryLineChartProps {
  items: HistoryIndexItem[];
  dataKey: keyof Pick<HistoryIndexItem, "score" | "sp500" | "nasdaq100" | "vix">;
  label: string;
  color?: string;
}

export default function HistoryLineChart({
  items,
  dataKey,
  label,
  color = "#0f766e",
}: HistoryLineChartProps) {
  const data = items
    .slice(-45)
    .map((item) => ({
      date: item.date.slice(5),
      value: item[dataKey],
    }))
    .filter((item) => typeof item.value === "number");

  if (data.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-500">
        历史样本积累后显示 {label} 趋势
      </div>
    );
  }

  return (
    <div className="h-64 rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis
            width={48}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
          />
          <Tooltip
            formatter={(value) => [value, label]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

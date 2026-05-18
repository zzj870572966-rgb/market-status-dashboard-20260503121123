"use client";

import Link from "next/link";
import { CalendarRange, Database, Gauge } from "lucide-react";

interface TerminalHoverNavProps {
  active: "overview" | "history" | "weekly";
  tone?: "light" | "dark";
}

const items = [
  {
    key: "overview",
    label: "市场总览",
    href: "/",
    icon: Gauge,
  },
  {
    key: "history",
    label: "历史风险数据",
    href: "/history",
    icon: Database,
  },
  {
    key: "weekly",
    label: "周度定投评分",
    href: "/weekly",
    icon: CalendarRange,
  },
] as const;

export default function TerminalHoverNav({
  active,
  tone = "dark",
}: TerminalHoverNavProps) {
  const isLight = tone === "light";
  const shellClass = isLight
    ? "border-emerald-900/10 bg-[#fffdf8]/86 text-emerald-950 shadow-[0_14px_34px_rgba(80,68,54,0.10)]"
    : "border-emerald-400/14 bg-[#06120d]/90 text-emerald-50 shadow-[0_14px_34px_rgba(0,0,0,0.30)]";
  const inactiveClass = isLight
    ? "text-emerald-950/58 hover:bg-emerald-50/75 hover:text-emerald-950"
    : "text-emerald-50/62 hover:bg-emerald-400/10 hover:text-emerald-50";
  const activeClass = isLight
    ? "border-emerald-800/14 bg-emerald-50/90 text-emerald-800 shadow-[0_8px_20px_rgba(4,120,87,0.08)]"
    : "border-emerald-300/18 bg-emerald-400/14 text-emerald-100 shadow-[0_8px_22px_rgba(16,185,129,0.10)]";

  return (
    <nav
      className={`fixed left-1/2 top-4 z-[80] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-xl border px-1.5 py-1.5 backdrop-blur-xl ${shellClass}`}
      aria-label="页面导航"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.key === active;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={`flex h-10 items-center gap-2 rounded-lg border border-transparent px-3 text-sm font-medium tracking-normal transition duration-200 ${
              isActive ? activeClass : inactiveClass
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

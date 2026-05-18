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
    ? "border-stone-300/70 bg-[#fffdf8]/92 shadow-[0_12px_28px_rgba(80,68,54,0.10)]"
    : "border-emerald-400/15 bg-[#06120d]/94 shadow-[0_12px_30px_rgba(0,0,0,0.28)]";
  const inactiveClass = isLight
    ? "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
    : "text-emerald-50/68 hover:bg-emerald-400/10 hover:text-emerald-50";
  const activeClass = isLight
    ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-800/12"
    : "bg-emerald-400/14 text-emerald-100 ring-1 ring-emerald-400/18";

  return (
    <nav
      className={`fixed left-4 top-4 z-[80] flex w-12 flex-col gap-1.5 rounded-lg border p-1.5 ${shellClass}`}
      aria-label="页面导航"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.key === active;

        return (
          <Link
            key={item.key}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            className={`flex h-9 w-9 items-center justify-center rounded-md transition duration-200 ${
              isActive ? activeClass : inactiveClass
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </Link>
        );
      })}
    </nav>
  );
}

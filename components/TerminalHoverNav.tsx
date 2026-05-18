"use client";

import Link from "next/link";
import { CalendarRange, Database, Gauge, Menu, X } from "lucide-react";
import { useState } from "react";

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
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;
  const isLight = tone === "light";
  const buttonClass = isLight
    ? "border-stone-300/70 bg-[#fffdf8]/94 text-stone-800 shadow-[0_10px_24px_rgba(80,68,54,0.10)] hover:bg-white"
    : "border-emerald-400/15 bg-[#06120d]/95 text-emerald-50 shadow-[0_10px_30px_rgba(0,0,0,0.28)]";
  const menuClass = isLight
    ? "border-stone-300/70 bg-[#fffdf8]/98 shadow-[0_16px_34px_rgba(80,68,54,0.14)]"
    : "border-emerald-400/15 bg-[#07140f]/95 shadow-[0_16px_34px_rgba(0,0,0,0.30)]";
  const inactiveClass = isLight
    ? "text-stone-700 hover:bg-stone-100/70 hover:text-stone-950"
    : "text-emerald-50/68 hover:bg-emerald-400/10 hover:text-emerald-50";
  const activeClass = isLight
    ? "bg-stone-100 text-stone-950"
    : "bg-emerald-400/14 text-emerald-100";

  function handleButtonClick() {
    if (pinned) {
      setPinned(false);
      setHovered(false);
      return;
    }

    setPinned(true);
  }

  return (
    <nav
      className="pointer-events-none fixed left-5 top-4 z-[80] h-10 w-12"
      aria-label="页面导航"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-label={open ? "关闭导航" : "打开导航"}
        aria-expanded={open}
        onClick={handleButtonClick}
        className={`pointer-events-auto flex h-10 w-12 items-center justify-center rounded-md border transition duration-200 ${buttonClass}`}
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>

      {open ? (
        <div
          className={`pointer-events-auto fixed left-[4.75rem] top-4 w-60 rounded-lg border p-2 ${menuClass}`}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === active;

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => {
                  setPinned(false);
                  setHovered(false);
                }}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition duration-200 ${
                  isActive ? activeClass : inactiveClass
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </nav>
  );
}

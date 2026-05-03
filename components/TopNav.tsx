"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Activity,
  BarChart3,
  Bitcoin,
  Gauge,
  LineChart,
  PiggyBank,
  ShieldAlert,
} from "lucide-react";

const navItems = [
  { href: "/overview", label: "总览", icon: Gauge },
  { href: "/sentiment", label: "情绪", icon: Activity },
  { href: "/valuation", label: "估值", icon: PiggyBank },
  { href: "/risk", label: "风险", icon: ShieldAlert },
  { href: "/macro", label: "宏观", icon: LineChart },
  { href: "/crypto", label: "加密", icon: Bitcoin },
  { href: "/options", label: "期权结构", icon: BarChart3 },
];

export default function TopNav() {
  const pathname = usePathname();
  const activePath = pathname === "/" ? "/overview" : pathname;

  return (
    <nav aria-label="市场状态导航" className="overflow-x-auto">
      <div className="flex min-w-max gap-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = activePath === href;

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
              )}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

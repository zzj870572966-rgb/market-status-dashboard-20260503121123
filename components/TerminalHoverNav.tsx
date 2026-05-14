import Link from "next/link";
import { ChevronDown, Database, Gauge } from "lucide-react";

interface TerminalHoverNavProps {
  active: "overview" | "history";
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
] as const;

export default function TerminalHoverNav({
  active,
  tone = "dark",
}: TerminalHoverNavProps) {
  const shellClass =
    tone === "light"
      ? "border-emerald-700/20 bg-white/80 text-emerald-950 shadow-[0_18px_48px_rgba(15,84,53,0.16)]"
      : "border-emerald-400/15 bg-[#06120d]/90 text-emerald-50 shadow-[0_18px_60px_rgba(0,0,0,0.35)]";
  const menuClass =
    tone === "light"
      ? "border-emerald-700/15 bg-white/95"
      : "border-emerald-400/15 bg-[#07140f]/95";
  const inactiveClass =
    tone === "light"
      ? "text-emerald-900/70 hover:bg-emerald-50 hover:text-emerald-950"
      : "text-emerald-50/68 hover:bg-emerald-400/10 hover:text-emerald-50";
  const activeClass =
    tone === "light"
      ? "bg-emerald-100 text-emerald-950"
      : "bg-emerald-400/14 text-emerald-100";

  return (
    <nav className="group fixed left-4 top-4 z-50 w-fit" aria-label="页面导航">
      <div
        className={`flex w-fit cursor-default items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium backdrop-blur-xl transition duration-300 ${shellClass}`}
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]" />
        <span>导航</span>
        <ChevronDown
          className="h-3.5 w-3.5 transition duration-300 group-hover:rotate-180"
          aria-hidden="true"
        />
      </div>

      <div
        className={`pointer-events-none absolute left-0 top-full mt-2 w-52 translate-y-1 rounded-lg border p-2 opacity-0 backdrop-blur-xl transition duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 ${menuClass}`}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === active;

          return (
            <Link
              key={item.key}
              href={item.href}
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
    </nav>
  );
}

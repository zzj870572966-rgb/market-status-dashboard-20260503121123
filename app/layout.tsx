import type { Metadata } from "next";
import TopNav from "@/components/TopNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "市场状态 Dashboard",
  description: "基于上一交易日收盘数据生成的市场状态观察面板。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="border-b border-slate-200 pb-5">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
                  市场状态
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  上一交易日收盘数据，每天自动更新一次。
                </p>
              </div>
            </div>
            <TopNav />
          </header>
          <main className="flex-1 py-6">{children}</main>
          <footer className="border-t border-slate-200 py-5 text-xs leading-6 text-slate-500">
            本项目仅用于市场状态观察与定投参考，不构成投资建议，也不是实时交易信号。
          </footer>
        </div>
      </body>
    </html>
  );
}

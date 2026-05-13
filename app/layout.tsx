import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "市场温度计",
  description: "基于上一交易日收盘数据的机构级市场温度与风险状态监控首页。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

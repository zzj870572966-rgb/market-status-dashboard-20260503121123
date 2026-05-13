import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "市场风险仪表盘",
  description: "机构级市场风险监控首页。",
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

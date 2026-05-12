import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "三导师 AI 学习成长系统",
  description: "陪你真正学懂、说出来、用起来、沉淀下来。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

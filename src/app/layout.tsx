import type { Metadata } from "next";
import "@/app/globals.css";
import { Sidebar } from "@/components/Sidebar";
import { AppStateProvider } from "@/lib/AppStateContext";

export const metadata: Metadata = {
  title: "NextStep — 从碎片经验中生成行动路线",
  description: "帮助大学生从碎片经验内容中生成个性化行动路径的 AI 路线规划工具。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-bg text-text-primary font-sans antialiased">
        <AppStateProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </AppStateProvider>
      </body>
    </html>
  );
}

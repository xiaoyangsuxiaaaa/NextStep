"use client";

import Link from "next/link";
import { useAppState } from "@/lib/AppStateContext";

export default function AnalysisPage() {
  const { activeGoal, activeBundle, debugRaw, runAnalysis } = useAppState();

  if (!activeGoal || !activeBundle) {
    return (
      <div className="max-w-lg mx-auto px-8 py-20 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-bg-tertiary flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-text-tertiary">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">还没有目标</h2>
        <p className="text-sm text-text-tertiary mb-6">先创建一个目标并添加经验，再来进行 AI 分析。</p>
        <Link href="/" className="btn btn-primary">返回首页创建目标</Link>
      </div>
    );
  }

  const { experiences, analysisResult, analysisStatus } = activeBundle;

  return (
    <div className="max-w-4xl mx-auto px-8 py-8 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">AI 综合分析</h1>
        <p className="text-sm text-text-tertiary mt-0.5">基于整个经验池做综合提炼，为「{activeGoal.title}」生成行动路线</p>
      </header>

      {/* Status bar */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">经验池状态</p>
            <p className="text-xs text-text-tertiary mt-1">
              已收集 <span className="font-semibold text-text-primary">{experiences.length}</span> 条经验
            </p>
          </div>

          {analysisStatus === "idle" && (
            <button onClick={runAnalysis} disabled={experiences.length === 0} className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
              开始 AI 综合分析
            </button>
          )}
          {analysisStatus === "loading" && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm font-medium">
              <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              AI 综合分析中...
            </div>
          )}
          {analysisStatus === "done" && (
            <Link href="/plan" className="btn btn-primary text-sm">查看行动路线</Link>
          )}
          {analysisStatus === "error" && (
            <button onClick={runAnalysis} className="btn btn-primary text-sm">重新分析</button>
          )}
        </div>
      </div>

      {/* Loading */}
      {analysisStatus === "loading" && (
        <div className="card p-12 text-center animate-fade-in">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-accent-subtle flex items-center justify-center">
            <svg className="animate-spin text-accent" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          </div>
          <p className="text-base font-medium text-text-primary mb-2">AI 正在综合分析你的经验池</p>
          <p className="text-sm text-text-tertiary">正在提取 {experiences.length} 条经验内容中的关键信息...</p>
        </div>
      )}

      {/* Error */}
      {analysisStatus === "error" && (
        <div className="card p-8 text-center">
          <p className="text-sm font-medium text-text-primary mb-1">AI 分析失败</p>
          <p className="text-xs text-text-tertiary mb-4">请检查网络连接和 API 配置后重试</p>
          <button onClick={runAnalysis} className="btn btn-primary text-sm">重新分析</button>
        </div>
      )}

      {/* Results — structured + raw */}
      {analysisStatus === "done" && (
        <div className="space-y-5 animate-slide-up">
          {/* ---- Structured Result ---- */}
          {analysisResult && (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-bg-tertiary border border-border flex items-center justify-center text-accent">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">综合分析结果</h3>
                  <p className="text-2xs text-text-tertiary">基于 {analysisResult.sourceCount} 条经验 · {analysisResult.generatedAt}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="card p-5 bg-accent-subtle border-accent/20">
                <p className="text-sm text-text-primary leading-relaxed">{analysisResult.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="card p-5">
                  <p className="text-xs font-medium text-text-secondary mb-2">高频共识</p>
                  <p className="text-sm text-text-primary leading-relaxed">{analysisResult.consensus}</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs font-medium text-text-secondary mb-2">分歧观点</p>
                  <ul className="space-y-1.5">
                    {analysisResult.divergentViews.map((v, i) => (
                      <li key={i} className="text-sm text-text-primary leading-relaxed">• {v}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-3 card p-5 border-accent/30 bg-accent-subtle">
                  <p className="text-xs font-medium text-accent mb-2">推荐行动</p>
                  <p className="text-sm font-semibold text-text-primary leading-relaxed">{analysisResult.recommendedAction}</p>
                </div>
                <div className="col-span-2 card p-5">
                  <p className="text-xs font-medium text-text-secondary mb-2">风险提醒</p>
                  <ul className="space-y-1">
                    {analysisResult.risks.map((r, i) => (
                      <li key={i} className="text-sm text-text-primary">! {r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-3 card p-5">
                  <p className="text-xs font-medium text-text-secondary mb-3">推荐教程</p>
                  <div className="space-y-2">
                    {analysisResult.tutorials.map((t, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-tertiary">
                        <span className="w-5 h-5 rounded-full bg-white border border-border flex items-center justify-center text-2xs font-semibold text-text-tertiary flex-shrink-0">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text-primary">{t.title}</p>
                          <p className="text-xs text-text-tertiary">{t.desc}</p>
                        </div>
                        <span className="text-2xs text-text-tertiary">{t.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 card p-5 flex flex-col">
                  <p className="text-xs font-medium text-text-secondary mb-3">下一步建议</p>
                  <p className="text-sm text-text-primary leading-relaxed flex-1">{analysisResult.nextStep}</p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <Link href="/plan" className="btn btn-primary w-full justify-center text-sm">查看完整行动路线</Link>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ---- Raw AI Response ---- */}
          {debugRaw && (
            <details className="card">
              <summary className="px-5 py-3 text-xs text-text-tertiary cursor-pointer hover:text-text-secondary select-none">查看 AI 原始返回</summary>
              <pre className="px-5 pb-4 text-xs text-text-tertiary leading-relaxed whitespace-pre-wrap break-words max-h-64 overflow-y-auto">{debugRaw}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

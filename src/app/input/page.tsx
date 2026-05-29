"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/lib/AppStateContext";
import type { ExperienceInputType, GoalBundle } from "@/lib/types";

const typeMeta: Record<ExperienceInputType, { label: string; icon: React.ReactNode; color: string; placeholder: string }> = {
  video: {
    label: "视频链接", icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>),
    color: "bg-violet-50 text-violet-500", placeholder: "粘贴视频链接或文案...",
  },
  post: {
    label: "帖子链接", icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>),
    color: "bg-amber-50 text-amber-500", placeholder: "粘贴帖子链接或文案...",
  },
  screenshot: {
    label: "评论截图", icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>),
    color: "bg-emerald-50 text-emerald-500", placeholder: "描述截图内容或粘贴文字...",
  },
  text: {
    label: "手动文本", icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>),
    color: "bg-rose-50 text-rose-500", placeholder: "手动输入经验内容...",
  },
};

const typeColors: Record<ExperienceInputType, string> = {
  video: "bg-violet-400",
  post: "bg-amber-400",
  screenshot: "bg-emerald-400",
  text: "bg-rose-400",
};

function GoalExperienceCard({ bundle, isActive, activeGoalId, setActiveGoal, onDeleteExp }: {
  bundle: GoalBundle;
  isActive: boolean;
  activeGoalId: string;
  setActiveGoal: (id: string) => void;
  onDeleteExp: (goalId: string, expId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { goal, experiences, analysisResult } = bundle;
  const totalExp = experiences.length;
  const analyzedCount = analysisResult?.sourceCount ?? 0;

  return (
    <div className={`card transition-all ${isActive ? "border-accent/30" : ""}`}>
      {/* Header — always visible */}
      <button
        onClick={() => { setExpanded(!expanded); if (!isActive) setActiveGoal(bundle.id); }}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-bg-tertiary/50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? "bg-accent text-white" : "bg-bg-tertiary text-text-tertiary"}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{goal.title}</p>
            <p className="text-2xs text-text-tertiary">{goal.type} · {totalExp} 条经验{analysisResult ? " · 已分析" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {isActive && <span className="badge badge-progress text-2xs">当前</span>}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            className={`text-text-tertiary transition-transform ${expanded ? "rotate-180" : ""}`}
          ><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-border animate-slide-up">
          {totalExp === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-text-tertiary">该目标下暂无经验内容</p>
              {!isActive && (
                <button onClick={() => setActiveGoal(activeGoalId === bundle.id ? activeGoalId : bundle.id)} className="btn btn-secondary text-xs mt-2">
                  切换到该目标添加经验
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2 pt-3">
              {experiences.map((exp) => (
                <div key={exp.id} className="flex items-start gap-3 p-3 rounded-lg bg-bg-tertiary group">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${typeMeta[exp.type].color}`}>
                    {typeMeta[exp.type].icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-text-primary">{typeMeta[exp.type].label}</span>
                      <span className="text-2xs text-text-tertiary">{exp.source}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{exp.content}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-2xs text-text-tertiary">{exp.createdAt}</span>
                    <button
                      onClick={() => onDeleteExp(bundle.id, exp.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white text-text-tertiary hover:text-danger"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InputPage() {
  const { goals, activeGoal, activeGoalId, activeBundle, setActiveGoal, addExperience, removeExperienceFromGoal, countByType } = useAppState();
  const [activeType, setActiveType] = useState<ExperienceInputType>("video");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");

  const handleAdd = () => {
    if (!content.trim() || !source.trim()) return;
    addExperience(activeType, content.trim(), source.trim());
    setContent(""); setSource("");
  };

  if (!activeGoal || !activeBundle) {
    return (
      <div className="max-w-lg mx-auto px-8 py-20 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-bg-tertiary flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-text-tertiary">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">还没有目标</h2>
        <p className="text-sm text-text-tertiary mb-6">先创建一个目标，再来添加经验内容。</p>
        <Link href="/" className="btn btn-primary">返回首页创建目标</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-text-secondary">
        <span className="text-text-tertiary">当前目标：</span>
        <Link href="/" className="font-medium text-text-primary hover:text-accent transition-colors">{activeGoal.title}</Link>
        <Link href="/" className="text-2xs text-accent hover:underline ml-1">修改</Link>
      </div>

      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">内容输入</h1>
        <p className="text-sm text-text-tertiary mt-0.5">
          向「<span className="font-medium text-text-primary">{activeGoal.title}</span>」添加经验内容
        </p>
      </header>

      {/* Input form — adds to active goal */}
      <div className="card p-5 mb-8">
        <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-1 w-fit mb-4 flex-wrap">
          {(Object.keys(typeMeta) as ExperienceInputType[]).map((t) => (
            <button key={t} onClick={() => setActiveType(t)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeType === t ? "bg-white text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-secondary"}`}>
              {typeMeta[t].icon}{typeMeta[t].label}
            </button>
          ))}
        </div>
        <textarea className="input resize-none min-h-[90px] mb-3" placeholder={typeMeta[activeType].placeholder} value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="flex gap-3">
          <input className="input flex-1" placeholder="来源（如：B站视频、小红书帖子、即刻评论...）" value={source} onChange={(e) => setSource(e.target.value)} />
          <button onClick={handleAdd} disabled={!content.trim() || !source.trim()} className="btn btn-primary whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>加入经验池
          </button>
        </div>
      </div>

      {/* Active goal stats */}
      <div className="flex items-center gap-6 mb-8 px-1">
        <span className="text-sm text-text-secondary">
          「<span className="font-semibold text-text-primary">{activeGoal.title}</span>」已收集 <span className="font-semibold text-text-primary">{activeBundle.experiences.length}</span> 条经验
        </span>
        {(Object.keys(typeMeta) as ExperienceInputType[]).map((t) => (
          <span key={t} className="text-xs text-text-tertiary flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${typeColors[t]}`} /> {typeMeta[t].label} {countByType(t)}
          </span>
        ))}
        <Link href="/analysis" className={`ml-auto btn btn-primary text-sm ${activeBundle.experiences.length === 0 ? "opacity-40 pointer-events-none" : ""}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>AI 综合生成行动路线
        </Link>
      </div>

      {/* All goals' experience pools */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">所有目标经验池</h3>
          <span className="text-xs text-text-tertiary">共 {goals.length} 个目标 · {goals.reduce((s, g) => s + g.experiences.length, 0)} 条总经验</span>
        </div>
        <div className="space-y-3">
          {goals.map((g) => (
            <GoalExperienceCard
              key={g.id}
              bundle={g}
              isActive={g.id === activeGoalId}
              activeGoalId={activeGoalId}
              setActiveGoal={setActiveGoal}
              onDeleteExp={removeExperienceFromGoal}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

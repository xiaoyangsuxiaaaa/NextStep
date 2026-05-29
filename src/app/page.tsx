"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/lib/AppStateContext";
import { GOAL_TYPES } from "@/lib/types";

export default function HomePage() {
  const { activeGoal, activeBundle, goals, activeGoalId, setActiveGoal, createGoal, deleteGoal, updateGoal } = useAppState();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("实习求职");
  const [newDesc, setNewDesc] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const actionPlan = activeBundle?.actionPlan ?? null;
  const experiences = activeBundle?.experiences ?? [];
  const analysisResult = activeBundle?.analysisResult ?? null;
  const totalSteps = actionPlan?.steps.length ?? 0;
  const completedSteps = actionPlan?.steps.filter((s) => s.completed).length ?? 0;
  const progress = actionPlan?.progress ?? 0;
  const nextStep = actionPlan?.steps.find((s) => !s.completed);
  const currentPhase = completedSteps + 1;

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createGoal(newTitle.trim(), newType, newDesc.trim());
    setNewTitle(""); setNewDesc(""); setShowCreate(false);
  };

  // ── No goals state ──
  if (goals.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-8 py-20 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-bg-tertiary flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-text-tertiary">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">设定你的第一个目标</h2>
        <p className="text-sm text-text-tertiary mb-8 leading-relaxed">
          不管是找实习、考研还是学技能，设定目标后 AI 会帮你从碎片经验中生成行动路线。
        </p>

        {showCreate ? (
          <div className="card p-5 space-y-3 text-left animate-slide-up">
            <p className="text-sm font-medium text-text-primary">创建新目标</p>
            <input className="input" placeholder="目标名称，如：找到第一份 PM 实习" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus />
            <div className="flex items-center gap-2 flex-wrap">
              {GOAL_TYPES.map((t) => (
                <button key={t} onClick={() => setNewType(t)} className={`text-xs px-2.5 py-1 rounded-full transition-all ${newType === t ? "bg-[#11181c] text-white" : "bg-bg-tertiary text-text-tertiary hover:text-text-secondary"}`}>{t}</button>
              ))}
            </div>
            <input className="input" placeholder="目标描述（可选）" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            <div className="flex items-center gap-2">
              <button onClick={handleCreate} className="btn btn-primary text-xs">创建目标</button>
              <button onClick={() => setShowCreate(false)} className="btn btn-ghost text-xs">取消</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            创建第一个目标
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-8 animate-fade-in">
      {/* Header */}
      <header className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">晚上好</h1>
          <p className="text-sm text-text-tertiary mt-0.5">这是你的行动路线概览</p>
        </div>

        {/* Goal switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-1">
            {goals.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGoal(g.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap max-w-[140px] truncate ${
                  g.id === activeGoalId
                    ? "bg-white text-text-primary shadow-sm"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {g.goal.title}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="btn btn-secondary text-xs flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            新建
          </button>
        </div>
      </header>

      {/* Create goal form */}
      {showCreate && (
        <div className="card p-5 mb-6 space-y-3 animate-slide-up">
          <p className="text-sm font-medium text-text-primary">创建新目标</p>
          <input className="input" placeholder="目标名称，如：找到第一份 PM 实习" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus />
          <div className="flex items-center gap-2 flex-wrap">
            {GOAL_TYPES.map((t) => (
              <button key={t} onClick={() => setNewType(t)} className={`text-xs px-2.5 py-1 rounded-full transition-all ${newType === t ? "bg-[#11181c] text-white" : "bg-bg-tertiary text-text-tertiary hover:text-text-secondary"}`}>{t}</button>
            ))}
          </div>
          <input className="input" placeholder="目标描述（可选）" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <div className="flex items-center gap-2">
            <button onClick={handleCreate} className="btn btn-primary text-xs">创建目标</button>
            <button onClick={() => setShowCreate(false)} className="btn btn-ghost text-xs">取消</button>
          </div>
        </div>
      )}

      {/* Active goal card */}
      {activeGoal && (
        editingGoal ? (
          <div className="card p-5 mb-8 space-y-3 animate-slide-up">
            <p className="text-sm font-medium text-text-primary">编辑目标</p>
            <input className="input" placeholder="目标名称" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus />
            <div className="flex items-center gap-2 flex-wrap">
              {GOAL_TYPES.map((t) => (
                <button key={t} onClick={() => setEditType(t)} className={`text-xs px-2.5 py-1 rounded-full transition-all ${editType === t ? "bg-[#11181c] text-white" : "bg-bg-tertiary text-text-tertiary hover:text-text-secondary"}`}>{t}</button>
              ))}
            </div>
            <input className="input" placeholder="目标描述（可选）" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            <div className="flex items-center gap-2">
              <button onClick={() => { updateGoal(activeGoalId, { title: editTitle.trim() || activeGoal.title, type: editType, description: editDesc.trim() }); setEditingGoal(false); }} className="btn btn-primary text-xs">保存</button>
              <button onClick={() => setEditingGoal(false)} className="btn btn-ghost text-xs">取消</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between card px-5 py-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#11181c] flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <div>
                <p className="text-2xs text-text-tertiary uppercase tracking-wider">当前目标</p>
                <p className="text-sm font-semibold text-text-primary">{activeGoal.title}</p>
              </div>
              <span className="badge badge-progress">{activeGoal.type}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setEditTitle(activeGoal.title); setEditType(activeGoal.type); setEditDesc(activeGoal.description || ""); setEditingGoal(true); }}
                className="text-xs text-text-tertiary hover:text-text-primary transition-colors px-2 py-1"
              >
                编辑
              </button>
              <button onClick={() => deleteGoal(activeGoalId)} className="text-xs text-text-tertiary hover:text-danger transition-colors px-2 py-1">删除</button>
            </div>
          </div>
        )
      )}

      {/* Next action — only if plan exists */}
      {actionPlan && nextStep && (
        <div className="relative mb-8 p-6 rounded-2xl bg-bg-tertiary border border-border overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-accent/8 to-transparent rounded-bl-[100px]" />
          <div className="relative">
            <p className="text-xs text-accent font-semibold uppercase tracking-wider mb-3">你现在最关键的一步</p>
            <h2 className="text-lg font-bold text-text-primary mb-2 leading-snug max-w-xl">{nextStep.title}</h2>
            <p className="text-sm text-text-tertiary mb-5 max-w-lg leading-relaxed">{nextStep.why}</p>
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              {nextStep.estimatedTime && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-text-tertiary"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span className="text-xs text-text-secondary">{nextStep.estimatedTime}</span>
                </div>
              )}
            </div>
            <Link href="/plan" className="btn btn-primary">开始执行<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <section className="grid grid-cols-3 gap-4 mb-6">
        <Link href="/plan" className="card p-4 hover:border-accent/30 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-accent-subtle text-accent flex items-center justify-center mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>
          </div>
          <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-0.5">阶段进度</p>
          <p className="text-sm font-semibold text-text-primary">{actionPlan ? `第 ${currentPhase > totalSteps ? totalSteps : currentPhase} 步 · 共 ${totalSteps} 步` : "尚未生成"}</p>
        </Link>
        <Link href="/plan" className="card p-4 hover:border-accent/30 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-0.5">路线进度</p>
          <p className="text-sm font-semibold text-text-primary">{actionPlan ? `${progress}% 已完成` : "0% 已完成"}</p>
        </Link>
        <Link href="/input" className="card p-4 hover:border-accent/30 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-500 flex items-center justify-center mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-0.5">经验池</p>
          <p className="text-sm font-semibold text-text-primary">{experiences.length} 条{analysisResult ? "已分析" : "待分析"}</p>
        </Link>
      </section>

      {/* Quick actions */}
      <section>
        <h3 className="text-sm font-semibold text-text-primary mb-3">快速操作</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "添加经验内容", desc: "收集视频、帖子、截图、文本", href: "/input", color: "bg-violet-50 text-violet-500" },
            { label: analysisResult ? "查看 AI 分析" : "AI 综合分析", desc: analysisResult ? "已有分析结果" : "基于经验池生成路线", href: "/analysis", color: "bg-emerald-50 text-emerald-500" },
            { label: "查看行动路线", desc: actionPlan ? `${totalSteps} 步成长路线` : "生成你的行动路线", href: "/plan", color: "bg-accent-subtle text-accent" },
            { label: "管理所有目标", desc: `共 ${goals.length} 个目标`, href: "/plan", color: "bg-amber-50 text-amber-500" },
          ].map((link) => (
            <Link key={link.label} href={link.href} className="card p-4 hover:border-accent/30 transition-colors group">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${link.color}`}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{link.label}</h4>
                  <p className="text-xs text-text-tertiary mt-0.5">{link.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

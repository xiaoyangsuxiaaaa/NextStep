"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/lib/AppStateContext";
import type { PlanStep, GoalBundle } from "@/lib/types";
import { GOAL_TYPES } from "@/lib/types";

// ── Inline edit form ──

function EditForm({ step, onSave, onCancel }: { step: PlanStep; onSave: (d: Partial<PlanStep>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(step.title);
  const [desc, setDesc] = useState(step.description);
  const [why, setWhy] = useState(step.why);
  const [time, setTime] = useState(step.estimatedTime);
  const [risk, setRisk] = useState(step.risk);
  return (
    <div className="space-y-3 p-1">
      <input className="input text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="步骤标题" />
      <textarea className="input resize-none min-h-[60px] text-sm" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="步骤描述" />
      <input className="input text-sm" value={why} onChange={(e) => setWhy(e.target.value)} placeholder="为什么做（AI 共识）" />
      <div className="grid grid-cols-2 gap-3">
        <input className="input text-sm" value={time} onChange={(e) => setTime(e.target.value)} placeholder="预计耗时" />
        <input className="input text-sm" value={risk} onChange={(e) => setRisk(e.target.value)} placeholder="风险提醒" />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onSave({ title: title.trim(), description: desc.trim(), why: why.trim(), estimatedTime: time.trim(), risk: risk.trim() })} className="btn btn-primary text-xs">保存</button>
        <button onClick={onCancel} className="btn btn-ghost text-xs">取消</button>
      </div>
    </div>
  );
}

// ── Expanded Plan View ──

function PlanDetail({ bundle, onClose }: { bundle: GoalBundle; onClose: () => void }) {
  const { setActiveGoal, activeGoalId, toggleStepComplete, updatePlanStep, deletePlanStep, addPlanStep, reorderSteps } = useAppState();
  const [editingId, setEditingId] = useState<string | null>(null);

  // Switch active goal to this bundle so editing operations work
  const isActive = bundle.id === activeGoalId;
  const plan = bundle.actionPlan;
  if (!plan) return null;

  const steps = plan.steps;
  const completedCount = steps.filter((s) => s.completed).length;
  const currentIdx = steps.findIndex((s) => !s.completed);

  const handleMove = (id: string, direction: "up" | "down") => {
    const idx = steps.findIndex((s) => s.id === id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === steps.length - 1) return;
    const next = [...steps];
    const target = direction === "up" ? idx - 1 : idx + 1;
    [next[idx], next[target]] = [next[target], next[idx]];
    reorderSteps(next);
  };

  const handleAdd = () => {
    const step: PlanStep = { id: `s${Date.now()}`, title: "新步骤", description: "输入描述...", why: "AI 共识分析...", completed: false, priority: "medium", estimatedTime: "", risk: "", tutorials: [] };
    addPlanStep(step);
    setEditingId(step.id);
  };

  // Ensure this bundle is active for editing
  const ensureActive = () => { if (!isActive) setActiveGoal(bundle.id); };

  return (
    <div className="animate-slide-up">
      {/* Back button */}
      <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        返回所有目标
      </button>

      {/* Progress */}
      <div className="card p-5 mb-8" onClick={ensureActive}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-text-primary">总体进度</span>
          <span className="text-sm font-semibold text-text-primary">{completedCount}/{steps.length} 步完成</span>
        </div>
        <div className="progress-bar h-2">
          <div className="progress-bar-fill h-2" style={{ width: `${plan.progress}%` }} />
        </div>
      </div>

      {/* Steps timeline */}
      <section className="mb-8">
        <div className="relative">
          <div className="absolute left-[22px] top-2 bottom-2 w-[2px] bg-border" />
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={step.id} className="relative flex items-start gap-4">
                <button
                  onClick={() => { ensureActive(); toggleStepComplete(step.id); }}
                  className={`relative z-10 w-[44px] h-[44px] rounded-full flex items-center justify-center flex-shrink-0 transition-all ${step.completed ? "bg-accent text-white shadow-[0_0_0_4px_rgba(79,110,247,0.12)]" : i === currentIdx ? "bg-accent text-white shadow-[0_0_0_4px_rgba(79,110,247,0.12)] animate-pulse" : "bg-white border-2 border-border text-text-tertiary hover:border-accent"}`}
                >
                  {step.completed ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> : <span className={`text-sm font-semibold ${i === currentIdx ? "text-white" : ""}`}>{i + 1}</span>}
                </button>
                <div className={`flex-1 min-w-0 card ${editingId === step.id ? "p-4" : "p-5"} ${i === currentIdx ? "border-accent/30 bg-accent-subtle" : ""} ${step.completed ? "opacity-70" : ""}`}>
                  {editingId === step.id ? (
                    <EditForm step={step} onSave={(data) => { ensureActive(); updatePlanStep(step.id, data); setEditingId(null); }} onCancel={() => setEditingId(null)} />
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <h4 className={`text-base font-semibold ${i === currentIdx ? "text-accent" : "text-text-primary"}`}>{step.title}</h4>
                        {i === currentIdx && <span className="badge badge-progress text-2xs">当前</span>}
                        {step.completed && <span className="badge badge-completed text-2xs">已完成</span>}
                        <span className={`text-2xs px-1.5 py-0.5 rounded-full ${step.priority === "high" ? "bg-red-50 text-red-500" : "bg-bg-tertiary text-text-tertiary"}`}>{step.priority === "high" ? "高优先" : "中优先"}</span>
                        <div className="ml-auto flex items-center gap-0.5">
                          <button onClick={() => { ensureActive(); handleMove(step.id, "up"); }} disabled={i === 0} className="p-1 rounded hover:bg-bg-tertiary text-text-tertiary disabled:opacity-30" title="上移"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg></button>
                          <button onClick={() => { ensureActive(); handleMove(step.id, "down"); }} disabled={i === steps.length - 1} className="p-1 rounded hover:bg-bg-tertiary text-text-tertiary disabled:opacity-30" title="下移"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg></button>
                          <button onClick={() => { ensureActive(); setEditingId(step.id); }} className="p-1 rounded hover:bg-bg-tertiary text-text-tertiary" title="编辑"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                          <button onClick={() => { ensureActive(); deletePlanStep(step.id); }} className="p-1 rounded hover:bg-red-50 text-text-tertiary hover:text-red-500" title="删除"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed mb-4">{step.description}</p>
                      <div className="p-3 rounded-lg bg-violet-50 border border-violet-100 mb-3">
                        <p className="text-2xs text-violet-500 font-medium uppercase tracking-wider mb-1">为什么做</p>
                        <p className="text-xs text-text-primary leading-relaxed">{step.why}</p>
                      </div>
                      {step.tutorials.length > 0 && (
                        <div className="mb-3">
                          <p className="text-2xs text-text-tertiary font-medium uppercase tracking-wider mb-2">对应教程</p>
                          <div className="space-y-1.5">
                            {step.tutorials.map((t) => (
                              <div key={t.title} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-tertiary">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-text-tertiary flex-shrink-0"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                                <div className="min-w-0 flex-1"><p className="text-xs font-medium text-text-primary">{t.title}</p><p className="text-2xs text-text-tertiary">{t.desc}</p></div>
                                <span className="text-2xs text-text-tertiary flex-shrink-0">{t.time}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-xs text-text-tertiary"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{step.estimatedTime}</span>
                        <span className="flex items-center gap-1 text-xs text-text-tertiary"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>{step.risk}</span>
                      </div>
                      {step.userNote && (
                        <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                          <p className="text-2xs text-amber-600 font-medium mb-0.5">我的批注</p>
                          <p className="text-xs text-amber-700">{step.userNote}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => { ensureActive(); handleAdd(); }} className="mt-4 w-full card p-4 border-dashed border-2 text-text-tertiary hover:text-text-secondary hover:border-text-tertiary transition-all flex items-center justify-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          <span className="text-sm font-medium">添加自定义步骤</span>
        </button>
      </section>

      {plan.risks.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-text-primary mb-3">风险提示</h3>
          <div className="card p-5">
            <div className="space-y-2">
              {plan.risks.map((risk, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-red-500"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </div>
                  <p className="text-sm text-text-primary">{risk}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ── Goal Card (collapsed) ──

function GoalCard({ bundle, onExpand }: { bundle: GoalBundle; onExpand: () => void }) {
  const { setActiveGoal, activeGoalId } = useAppState();
  const { goal, actionPlan, experiences, analysisResult, analysisStatus } = bundle;
  const isActive = bundle.id === activeGoalId;
  const totalSteps = actionPlan?.steps.length ?? 0;
  const completedSteps = actionPlan?.steps.filter((s) => s.completed).length ?? 0;

  return (
    <div
      onClick={() => { setActiveGoal(bundle.id); onExpand(); }}
      className="card p-5 cursor-pointer hover:border-accent/30 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? "bg-accent text-white" : "bg-bg-tertiary text-text-tertiary"}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors truncate">{goal.title}</h3>
            <p className="text-2xs text-text-tertiary">{goal.type} · {goal.createdAt}</p>
          </div>
        </div>
        {analysisStatus === "loading" && <span className="badge badge-progress text-2xs">分析中</span>}
        {analysisStatus === "done" && actionPlan && <span className="badge badge-progress text-2xs">进行中</span>}
        {analysisStatus === "error" && <span className="text-2xs text-danger">分析失败</span>}
        {analysisStatus === "idle" && <span className="text-2xs text-text-tertiary">{experiences.length} 条经验</span>}
      </div>

      {/* Progress */}
      {actionPlan && (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-tertiary">{completedSteps}/{totalSteps} 步</span>
            <span className="text-xs text-text-tertiary">{actionPlan.progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${actionPlan.progress}%` }} />
          </div>
        </>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
        <span className="text-2xs text-text-tertiary">{experiences.length} 条经验</span>
        {analysisResult && <span className="text-2xs text-text-tertiary">AI 已分析</span>}
        <span className="text-2xs text-accent ml-auto group-hover:underline">查看详情 →</span>
      </div>
    </div>
  );
}

// ── Page ──

export default function PlanPage() {
  const { goals, createGoal, deleteGoal } = useAppState();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("实习求职");

  const expanded = expandedId ? goals.find((g) => g.id === expandedId) : null;

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createGoal(newTitle.trim(), newType, "");
    setNewTitle(""); setShowCreate(false);
  };

  // Expanded view
  if (expanded) {
    return (
      <div className="max-w-2xl mx-auto px-8 py-8 animate-fade-in">
        <PlanDetail bundle={expanded} onClose={() => setExpandedId(null)} />
      </div>
    );
  }

  // Grid view — all goals
  return (
    <div className="max-w-4xl mx-auto px-8 py-8 animate-fade-in">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">行动计划</h1>
          <p className="text-sm text-text-tertiary mt-0.5">共 {goals.length} 个目标</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary text-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          创建新目标
        </button>
      </header>

      {/* Create form */}
      {showCreate && (
        <div className="card p-5 mb-6 space-y-3 animate-slide-up">
          <p className="text-sm font-medium text-text-primary">创建新目标</p>
          <div className="flex gap-3">
            <input className="input flex-1" placeholder="目标名称，如：找到第一份 PM 实习" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus />
            <select className="input w-32" value={newType} onChange={(e) => setNewType(e.target.value)}>
              {GOAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCreate} className="btn btn-primary text-xs">创建</button>
            <button onClick={() => setShowCreate(false)} className="btn btn-ghost text-xs">取消</button>
          </div>
        </div>
      )}

      {/* Goal cards grid */}
      {goals.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm text-text-secondary mb-4">还没有目标，创建一个开始吧</p>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary text-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            创建第一个目标
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {goals.map((g) => (
            <GoalCard key={g.id} bundle={g} onExpand={() => setExpandedId(g.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

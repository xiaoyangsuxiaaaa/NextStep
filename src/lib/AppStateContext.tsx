"use client";

import {
  createContext, useContext, useState, useCallback, useEffect, type ReactNode,
} from "react";
import type {
  Goal, GoalBundle, Experience, ExperienceInputType,
  AnalysisResult, ActionPlan, PlanStep, AnalysisStatus,
} from "@/lib/types";

// ── State shape ──

interface AppState {
  goals: GoalBundle[];
  activeGoalId: string;
}

interface AppStateContextType {
  // Goal management
  goals: GoalBundle[];
  activeGoalId: string;
  activeGoal: Goal | null;
  activeBundle: GoalBundle | null;
  createGoal: (title: string, type: string, description: string) => void;
  deleteGoal: (id: string) => void;
  setActiveGoal: (id: string) => void;
  updateGoalTitle: (id: string, title: string) => void;
  updateGoal: (id: string, changes: Partial<Goal>) => void;

  // Experience (on active goal)
  addExperience: (type: ExperienceInputType, content: string, source: string) => void;
  removeExperience: (id: string) => void;
  removeExperienceFromGoal: (goalId: string, expId: string) => void;
  countByType: (type: ExperienceInputType) => number;

  // Analysis (on active goal)
  runAnalysis: () => void;

  // DEBUG: raw AI response
  debugRaw: string | null;
  updatePlanStep: (stepId: string, changes: Partial<PlanStep>) => void;
  deletePlanStep: (stepId: string) => void;
  addPlanStep: (step: PlanStep) => void;
  reorderSteps: (steps: PlanStep[]) => void;
  toggleStepComplete: (stepId: string) => void;
}

const STORAGE_KEY = "nextstep_v3_state";

// ── Helpers ──

let _idCounter = 10;
function uid(prefix: string) {
  return `${prefix}${Date.now()}${_idCounter++}`;
}

function makeGoalBundle(title: string, type: string, description: string): GoalBundle {
  const now = new Date().toISOString().slice(0, 10);
  const id = uid("g");
  return {
    id,
    goal: { id, title, type, description, createdAt: now },
    experiences: [],
    analysisResult: null,
    actionPlan: null,
    analysisStatus: "idle",
  };
}

// ── Default state ──

const defaultState: AppState = {
  goals: [],
  activeGoalId: "",
};

// ── localStorage ──

function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.goals && "activeGoalId" in parsed) return parsed;
    }
  } catch {}
  return defaultState;
}

function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

// ── Build ActionPlan from AnalysisResult ──

function buildActionPlan(analysis: AnalysisResult, goalTitle: string): ActionPlan {
  const now = new Date().toISOString().slice(0, 10);
  // Create dynamic steps from the analysis
  const steps: PlanStep[] = [
    {
      id: uid("s"), title: "理解目标与共识", description: `根据 AI 分析，关于「${goalTitle}」的高频共识是：${analysis.consensus}`,
      why: "了解行业共识是正确起步的关键，避免方向错误。", completed: true, priority: "high",
      estimatedTime: "1 天", risk: analysis.risks[0] || "忽略共识导致方向偏离",
      tutorials: analysis.tutorials.slice(0, 1),
    },
  ];

  // Add main action step
  steps.push({
    id: uid("s"), title: analysis.recommendedAction, description: `基于经验池综合分析推荐的核心行动。`,
    why: analysis.consensus, completed: false, priority: "high",
    estimatedTime: "3-7 天", risk: analysis.risks[1] || analysis.risks[0] || "执行不彻底",
    tutorials: analysis.tutorials,
  });

  // Add tutorial-based steps
  analysis.tutorials.forEach((t, i) => {
    if (i > 0) {
      steps.push({
        id: uid("s"), title: t.title, description: t.desc,
        why: "这是完成核心行动的关键技能。", completed: false, priority: "medium",
        estimatedTime: t.time, risk: "跳过此步骤可能导致项目质量不足",
        tutorials: [t],
      });
    }
  });

  return {
    id: uid("plan"),
    title: `${goalTitle} — 行动路线`,
    description: "基于经验池 DeepSeek AI 综合分析生成",
    goal: goalTitle,
    status: "active",
    progress: Math.round((1 / steps.length) * 100),
    steps,
    risks: analysis.risks,
    createdAt: now,
    updatedAt: now,
  };
}

// ── Context ──

const AppStateContext = createContext<AppStateContextType | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  // Always start with defaultState — NEVER read localStorage during render.
  // localStorage is loaded inside useEffect (client-only), keeping server & client
  // initial renders identical and avoiding hydration mismatches.
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) saveState(state); }, [state, hydrated]);

  // ── Helpers: update the active goal's bundle ──

  const updateActiveBundle = useCallback((fn: (b: GoalBundle) => GoalBundle) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === prev.activeGoalId ? fn(g) : g)),
    }));
  }, []);

  const activeBundle = state.goals.find((g) => g.id === state.activeGoalId) ?? null;
  const activeGoal = activeBundle?.goal ?? null;

  // ── Goal management ──

  const createGoal = useCallback((title: string, type: string, description: string) => {
    const bundle = makeGoalBundle(title, type, description);
    setState((prev) => ({ goals: [...prev.goals, bundle], activeGoalId: bundle.id }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setState((prev) => {
      const next = prev.goals.filter((g) => g.id !== id);
      if (next.length === 0) {
        return { goals: [], activeGoalId: "" };
      }
      return {
        goals: next,
        activeGoalId: prev.activeGoalId === id ? next[0].id : prev.activeGoalId,
      };
    });
  }, []);

  const setActiveGoal = useCallback((id: string) => {
    setState((prev) => (prev.goals.some((g) => g.id === id) ? { ...prev, activeGoalId: id } : prev));
  }, []);

  const updateGoalTitle = useCallback((id: string, title: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === id ? { ...g, goal: { ...g.goal, title } } : g,
      ),
    }));
  }, []);

  const updateGoal = useCallback((id: string, changes: Partial<Goal>) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === id ? { ...g, goal: { ...g.goal, ...changes } } : g,
      ),
    }));
  }, []);

  // ── Experience (on active goal) ──

  const addExperience = useCallback((type: ExperienceInputType, content: string, source: string) => {
    if (!state.activeGoalId) return;
    const exp: Experience = { id: uid("e"), type, content, source, createdAt: new Date().toISOString().slice(0, 10) };
    updateActiveBundle((b) => ({ ...b, experiences: [exp, ...b.experiences] }));
  }, [state.activeGoalId, updateActiveBundle]);

  const removeExperience = useCallback((id: string) => {
    updateActiveBundle((b) => ({ ...b, experiences: b.experiences.filter((e) => e.id !== id) }));
  }, [updateActiveBundle]);

  const removeExperienceFromGoal = useCallback((goalId: string, expId: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === goalId ? { ...g, experiences: g.experiences.filter((e) => e.id !== expId) } : g,
      ),
    }));
  }, []);

  const countByType = useCallback(
    (type: ExperienceInputType) => activeBundle?.experiences.filter((e) => e.type === type).length ?? 0,
    [activeBundle],
  );

  // ── Analysis (on active goal) ──

  // DEBUG: store raw AI response for inspection
  const [debugRaw, setDebugRaw] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!activeBundle || activeBundle.experiences.length === 0) return;
    updateActiveBundle((b) => ({ ...b, analysisStatus: "loading" }));

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: activeBundle.goal.title,
          experiences: activeBundle.experiences.map((e) => ({
            type: e.type,
            content: e.content,
            source: e.source,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || `请求失败 (${res.status})`);
      }

      const data = await res.json();

      const analysisResult = (data.result as AnalysisResult) || null;
      const rawText = (data.raw as string) || "";

      // Store raw for debugging
      setDebugRaw(rawText);

      if (analysisResult?.consensus) {
        const actionPlan = buildActionPlan(analysisResult, activeBundle.goal.title);
        updateActiveBundle((b) => ({ ...b, analysisResult, actionPlan, analysisStatus: "done" }));
      } else {
        updateActiveBundle((b) => ({ ...b, analysisStatus: "done" }));
        // Still show raw on the analysis page even if parsing was partial
        console.error("[analyze] 解析结果不完整，仅显示原始内容");
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      updateActiveBundle((b) => ({
        ...b,
        analysisStatus: "error",
        analysisResult: {
          consensus: "",
          divergentViews: [],
          recommendedAction: "",
          risks: [],
          tutorials: [],
          nextStep: "",
          summary: "",
          sourceCount: 0,
          generatedAt: "",
        },
      }));
    }
  }, [activeBundle, updateActiveBundle]);

  // ── Plan editing (on active goal) ──

  const updatePlanStep = useCallback((stepId: string, changes: Partial<PlanStep>) => {
    updateActiveBundle((b) => {
      if (!b.actionPlan) return b;
      return {
        ...b,
        actionPlan: {
          ...b.actionPlan,
          steps: b.actionPlan.steps.map((s) => (s.id === stepId ? { ...s, ...changes } : s)),
          updatedAt: new Date().toISOString().slice(0, 10),
        },
      };
    });
  }, [updateActiveBundle]);

  const deletePlanStep = useCallback((stepId: string) => {
    updateActiveBundle((b) => {
      if (!b.actionPlan) return b;
      return { ...b, actionPlan: { ...b.actionPlan, steps: b.actionPlan.steps.filter((s) => s.id !== stepId), updatedAt: new Date().toISOString().slice(0, 10) } };
    });
  }, [updateActiveBundle]);

  const addPlanStep = useCallback((step: PlanStep) => {
    updateActiveBundle((b) => {
      if (!b.actionPlan) return b;
      return { ...b, actionPlan: { ...b.actionPlan, steps: [...b.actionPlan.steps, step], updatedAt: new Date().toISOString().slice(0, 10) } };
    });
  }, [updateActiveBundle]);

  const reorderSteps = useCallback((steps: PlanStep[]) => {
    updateActiveBundle((b) => {
      if (!b.actionPlan) return b;
      return { ...b, actionPlan: { ...b.actionPlan, steps, updatedAt: new Date().toISOString().slice(0, 10) } };
    });
  }, [updateActiveBundle]);

  const toggleStepComplete = useCallback((stepId: string) => {
    updateActiveBundle((b) => {
      if (!b.actionPlan) return b;
      const steps = b.actionPlan.steps.map((s) => (s.id === stepId ? { ...s, completed: !s.completed } : s));
      const completedCount = steps.filter((s) => s.completed).length;
      const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
      return { ...b, actionPlan: { ...b.actionPlan, steps, progress, updatedAt: new Date().toISOString().slice(0, 10) } };
    });
  }, [updateActiveBundle]);

  // ── Value ──

  const value: AppStateContextType = {
    goals: state.goals,
    activeGoalId: state.activeGoalId,
    activeGoal,
    activeBundle,
    createGoal,
    deleteGoal,
    setActiveGoal,
    updateGoalTitle,
    updateGoal,
    addExperience,
    removeExperience,
    removeExperienceFromGoal,
    countByType,
    runAnalysis,
    debugRaw,
    updatePlanStep,
    deletePlanStep,
    addPlanStep,
    reorderSteps,
    toggleStepComplete,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

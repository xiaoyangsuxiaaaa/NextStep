import type { ReactNode } from "react";

// ── Experience ──

export type ExperienceInputType = "video" | "post" | "screenshot" | "text";

export interface Experience {
  id: string;
  type: ExperienceInputType;
  content: string;
  source: string;
  createdAt: string;
}

// ── Goal ──

export const GOAL_TYPES = ["实习求职", "技能提升", "项目实战", "考研准备", "留学申请"];

export interface Goal {
  id: string;
  title: string;
  type: string;
  description: string;
  createdAt: string;
}

// ── Goal Bundle (one goal + all its data) ──

export type AnalysisStatus = "idle" | "loading" | "done" | "error";

export interface GoalBundle {
  id: string;
  goal: Goal;
  experiences: Experience[];
  analysisResult: AnalysisResult | null;
  actionPlan: ActionPlan | null;
  analysisStatus: AnalysisStatus;
}

// ── Action Plan ──

export type PlanStatus = "draft" | "active" | "completed";

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  why: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  estimatedTime: string;
  risk: string;
  tutorials: { title: string; desc: string; time: string }[];
  userNote?: string;
}

export interface ActionPlan {
  id: string;
  title: string;
  description: string;
  goal: string;
  status: PlanStatus;
  progress: number;
  steps: PlanStep[];
  createdAt: string;
  updatedAt: string;
  risks: string[];
}

// ── AI Analysis ──

export interface AnalysisResult {
  consensus: string;
  divergentViews: string[];
  recommendedAction: string;
  risks: string[];
  tutorials: { title: string; desc: string; time: string }[];
  nextStep: string;
  summary: string;
  sourceCount: number;
  generatedAt: string;
}

// ── Sidebar ──

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

import { reorderById } from "@/shared/lib/reorder"
import type { Goal, Milestone, Subgoal } from "../model/goal"

// The goal's own steps and its subgoals share one top-level order (owner,
// 2026-11-08: "a step can come before a subgoal and the other way round").
// They still live in two JSON arrays; each top-level item carries an
// optional `order`. Goals saved before this have no `order` and keep the
// old layout — own steps first, then subgoals — via the fallback index.
export type GoalItem = { kind: "step"; item: Milestone } | { kind: "subgoal"; item: Subgoal }

type Keyed = GoalItem & { id: string; key: number }

function keyed(goal: Pick<Goal, "milestones" | "subgoals">): Keyed[] {
  const steps = goal.milestones.map((item, i): Keyed => ({
    kind: "step",
    item,
    id: item.id,
    key: item.order ?? i,
  }))
  const subgoals = goal.subgoals.map((item, j): Keyed => ({
    kind: "subgoal",
    item,
    id: item.id,
    key: item.order ?? goal.milestones.length + j,
  }))
  // Array.prototype.sort is stable, so equal keys keep steps-then-subgoals.
  return [...steps, ...subgoals].sort((a, b) => a.key - b.key)
}

export function getGoalItems(goal: Pick<Goal, "milestones" | "subgoals">): GoalItem[] {
  return keyed(goal).map(({ kind, item }) => ({ kind, item }) as GoalItem)
}

// Moves one top-level item onto another's place and writes a fresh `order`
// to every top-level item, so the result no longer depends on fallbacks.
export function reorderGoalItems(
  goal: Pick<Goal, "milestones" | "subgoals">,
  draggedId: string,
  targetId: string,
): { milestones: Milestone[]; subgoals: Subgoal[] } {
  const list = reorderById(keyed(goal), draggedId, targetId)
  const milestones: Milestone[] = []
  const subgoals: Subgoal[] = []
  list.forEach((entry, order) => {
    if (entry.kind === "step") milestones.push({ ...entry.item, order })
    else subgoals.push({ ...entry.item, order })
  })
  return { milestones, subgoals }
}

// `order` for a newly added top-level step or subgoal: after everything else.
export function nextGoalItemOrder(goal: Pick<Goal, "milestones" | "subgoals">): number {
  return keyed(goal).reduce((max, entry) => Math.max(max, entry.key), -1) + 1
}

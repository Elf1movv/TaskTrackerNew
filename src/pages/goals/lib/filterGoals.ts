import type { Goal } from "@/entities/goal"

// "all" | NO_CATEGORY_FILTER | a category name — same idea as the category
// chips on the Tasks page (pages/tasks/lib/filterTasks.ts).
export const NO_CATEGORY_FILTER = "__none__"

export function filterGoals<T extends Pick<Goal, "category">>(goals: T[], categoryFilter: string): T[] {
  if (categoryFilter === "all") return goals
  if (categoryFilter === NO_CATEGORY_FILTER) return goals.filter(goal => !goal.category)
  return goals.filter(goal => goal.category === categoryFilter)
}

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { useSearchParams } from "react-router"
import { GoalList } from "@/widgets/goal-list"
import { CategoryChips } from "@/features/category/manage-categories"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { GoalsProvider, useGoalsContext } from "../connectors"
import { filterGoals, NO_CATEGORY_FILTER } from "../lib/filterGoals"

function GoalsPageContent() {
  const { goals } = useGoalsContext()
  const { t } = useLanguage()
  const [isAdding, setIsAdding] = useState(false)
  // The same category block as the Tasks page (CategoryChips), so "Work"
  // shows both the work tasks (there) and the work goals (here), and
  // categories can be managed from either page (audit Д4, decision 3).
  // Reordering goals while filtered is safe: reorderGoals always reorders
  // the full list (reorderById).
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [searchParams, setSearchParams] = useSearchParams()
  const focusedGoalId = searchParams.get("goal") ?? undefined

  // One-shot deep link from the Today page's goal-progress card — GoalList
  // reads it once to expand that goal and scroll to it; this just
  // clears it from the URL right away so it doesn't linger or re-fire on a
  // later navigation.
  useEffect(() => {
    if (!focusedGoalId) return
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete("goal")
        return next
      },
      { replace: true },
    )
  }, [focusedGoalId, setSearchParams])

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1>{t("goals.title")}</h1>
          <p className="text-body text-muted-foreground">{t("goals.subtitle")}</p>
        </div>
        <Button
          onClick={() => setIsAdding(v => !v)}
          className="h-11 px-5 gap-2 rounded-md shadow-raised text-body"
        >
          <Plus size={18} />
          {t("goals.addGoal")}
        </Button>
      </div>

      <CategoryChips
        value={categoryFilter}
        onChange={setCategoryFilter}
        extraChips={[{ value: NO_CATEGORY_FILTER, label: t("goalForm.noCategory") }]}
      />

      <GoalList
        goals={filterGoals(goals, categoryFilter)}
        initialGoalId={focusedGoalId}
        isAdding={isAdding}
        onCloseAdding={() => setIsAdding(false)}
      />
    </div>
  )
}

export function GoalsPage() {
  return (
    <GoalsProvider>
      <GoalsPageContent />
    </GoalsProvider>
  )
}

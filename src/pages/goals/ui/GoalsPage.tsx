import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { useSearchParams } from "react-router"
import { GoalList } from "@/widgets/goal-list"
import { useCategories } from "@/entities/category"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { GoalsProvider, useGoalsContext } from "../connectors"
import { filterGoals, NO_CATEGORY_FILTER } from "../lib/filterGoals"

function GoalsPageContent() {
  const { goals } = useGoalsContext()
  const { categories } = useCategories()
  const { t } = useLanguage()
  const [isAdding, setIsAdding] = useState(false)
  // Same category chips as the Tasks page, so "Work" shows both the work
  // tasks (there) and the work goals (here). Reordering while filtered is
  // safe: reorderGoals always reorders the full list (reorderById).
  const [categoryFilter, setCategoryFilter] = useState("all")
  const chips = [
    { value: "all", label: t("tasks.categoryAll") },
    ...categories.map(c => ({ value: c.name, label: c.name, color: c.color })),
    { value: NO_CATEGORY_FILTER, label: t("goalForm.noCategory") },
  ]
  const [searchParams, setSearchParams] = useSearchParams()
  const focusedGoalId = searchParams.get("goal") ?? undefined

  // One-shot deep link from the Today page's goal-progress card — GoalList
  // reads it once to expand that goal and move it to the top; this just
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
          <h1 className="text-[40px] leading-[1.1] font-extrabold tracking-[-0.03em]">{t("goals.title")}</h1>
          <p className="text-[15px] text-muted-foreground">{t("goals.subtitle")}</p>
        </div>
        <Button
          onClick={() => setIsAdding(v => !v)}
          className="h-11 px-5 gap-2 rounded-[10px] shadow-raised text-[15px]"
        >
          <Plus size={18} />
          {t("goals.addGoal")}
        </Button>
      </div>

      {goals.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap items-center">
          {chips.map(chip => (
            <button
              key={chip.value}
              type="button"
              aria-pressed={categoryFilter === chip.value}
              onClick={() => setCategoryFilter(chip.value)}
              className={`flex items-center gap-2 h-[34px] px-3.5 rounded-full text-[13px] font-semibold transition-all ${
                categoryFilter === chip.value
                  ? "bg-primary text-primary-foreground border border-primary"
                  : "border border-border bg-card text-foreground"
              }`}
            >
              {"color" in chip && (
                <span className="size-2 rounded-full shrink-0" style={{ background: chip.color }} />
              )}
              {chip.label}
            </button>
          ))}
        </div>
      )}

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

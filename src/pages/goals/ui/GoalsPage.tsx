import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { useSearchParams } from "react-router"
import { GoalList } from "@/widgets/goal-list"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { GoalsProvider, useGoalsContext } from "../connectors"

function GoalsPageContent() {
  const { goals } = useGoalsContext()
  const { t } = useLanguage()
  const [isAdding, setIsAdding] = useState(false)
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

      <GoalList
        goals={goals}
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

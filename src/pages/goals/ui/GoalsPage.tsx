import { useEffect } from "react"
import { useSearchParams } from "react-router"
import { GoalList } from "@/widgets/goal-list"
import { useLanguage } from "@/shared/lib/i18n"
import { displayFont } from "@/shared/lib/typography"
import { GoalsProvider, useGoalsContext } from "../connectors"

function GoalsPageContent() {
  const { goals } = useGoalsContext()
  const { t } = useLanguage()
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
      <div className="mb-8">
        <h1 css={displayFont} className="text-3xl mb-1">
          {t("goals.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("goals.subtitle")}</p>
      </div>

      <GoalList goals={goals} initialGoalId={focusedGoalId} />
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

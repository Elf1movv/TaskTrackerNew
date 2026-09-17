import { GoalList } from "@/widgets/goal-list"
import { useLanguage } from "@/shared/lib/i18n"
import { displayFont } from "@/shared/lib/typography"
import { GoalsProvider, useGoalsContext } from "../connectors"

function GoalsPageContent() {
  const { goals } = useGoalsContext()
  const { t } = useLanguage()

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 css={displayFont} className="text-3xl mb-1">
          {t("goals.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("goals.subtitle")}</p>
      </div>

      <GoalList goals={goals} />
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

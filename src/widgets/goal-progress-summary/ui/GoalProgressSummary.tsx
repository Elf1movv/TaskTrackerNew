import { Target } from "lucide-react"
import { Link } from "react-router"
import { type Goal } from "@/entities/goal"
import { useLanguage } from "@/shared/lib/i18n"
import { GoalProgressRow } from "./components"

export function GoalProgressSummary({ goals }: { goals: Goal[] }) {
  const { t } = useLanguage()

  return (
    <div className="lg:min-h-[300px] bg-card border border-border rounded-2xl shadow-raised px-5 py-5 pr-9 flex flex-col gap-4">
      <h2 className="text-xl font-bold tracking-[-0.015em]">{t("goalProgress.title")}</h2>
      {goals.length > 0 ? (
        <>
          <div className="flex flex-col gap-[18px]">
            {goals.map(goal => (
              <GoalProgressRow key={goal.id} goal={goal} />
            ))}
          </div>
          <Link to="/goals" className="mt-auto text-[13px] font-bold pb-1.5 hover:underline">
            {t("goalProgress.viewAll")} →
          </Link>
        </>
      ) : (
        <div className="flex-1 py-7 px-2 flex flex-col items-center gap-2 text-center">
          <span className="size-11 rounded-[13px] bg-primary-soft text-primary flex items-center justify-center">
            <Target size={20} strokeWidth={1.75} />
          </span>
          <span className="text-[15px] font-bold">{t("goals.noGoalsYet")}</span>
          <Link to="/goals" className="text-[13px] font-bold hover:underline">
            {t("goalProgress.addGoal")} →
          </Link>
        </div>
      )}
    </div>
  )
}

import { GoalProgressSummary } from "@/widgets/goal-progress-summary"
import { HabitTrackerGrid } from "@/widgets/habit-tracker-grid"
import { TodayTasksCard } from "@/widgets/today-tasks-card"
import { displayFont, monoFont } from "@/shared/lib/typography"
import { TodayProvider, useTodayContext } from "../connectors/TodayContext"
import { formatHeroDate } from "../utilits/formatHeroDate"

function TodayPageContent() {
  const { todayTasks, goals, habits } = useTodayContext()
  const { weekday, day, monthYear } = formatHeroDate(new Date())

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="mb-10">
        <div css={monoFont} className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">
          {weekday}
        </div>
        <div className="flex items-baseline gap-5">
          <span css={displayFont} className="text-8xl font-bold leading-none tracking-tight">
            {day}
          </span>
          <span css={monoFont} className="text-muted-foreground">
            {monthYear}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <TodayTasksCard tasks={todayTasks} />
        <GoalProgressSummary goals={goals} />
      </div>

      <HabitTrackerGrid habits={habits} />
    </div>
  )
}

export function TodayPage() {
  return (
    <TodayProvider>
      <TodayPageContent />
    </TodayProvider>
  )
}

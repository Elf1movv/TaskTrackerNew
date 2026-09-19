import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus } from "lucide-react"
import { useSearchParams } from "react-router"
import { TaskForm } from "@/features/task-form"
import { WelcomeBackGreeting, WelcomeModal } from "@/widgets/onboarding"
import { GoalProgressSummary } from "@/widgets/goal-progress-summary"
import { HabitTrackerGrid } from "@/widgets/habit-tracker-grid"
import { TodayTasksCard } from "@/widgets/today-tasks-card"
import { useLanguage } from "@/shared/lib/i18n"
import { displayFont, monoFont } from "@/shared/lib/typography"
import { Button } from "@/shared/ui/button"
import { TodayProvider, useTodayContext } from "../connectors"
import { formatHeroDate } from "../lib/formatHeroDate"

function TodayPageContent() {
  const { todayTasks, goals, habits } = useTodayContext()
  const { language, t } = useLanguage()
  const { weekday, day, monthYear } = formatHeroDate(new Date(), language)
  const [isAdding, setIsAdding] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const isFirstLogin = searchParams.get("firstLogin") === "1"
  const isWelcomeBack = searchParams.get("welcomeBack") === "1"

  function clearGreetingParam() {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete("firstLogin")
        next.delete("welcomeBack")
        return next
      },
      { replace: true },
    )
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
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
        <Button size="sm" onClick={() => setIsAdding(v => !v)}>
          <Plus size={14} />
          {t("tasks.addTask")}
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden mb-5"
          >
            <TaskForm onDone={() => setIsAdding(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <TodayTasksCard tasks={todayTasks} />
        <GoalProgressSummary goals={goals} />
      </div>

      <HabitTrackerGrid habits={habits} />

      {isFirstLogin && <WelcomeModal open onClose={clearGreetingParam} />}
      {isWelcomeBack && <WelcomeBackGreeting onDone={clearGreetingParam} />}
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

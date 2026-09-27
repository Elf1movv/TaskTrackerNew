import { format } from "date-fns"
import { NavLink } from "react-router"
import { getTaskCompletionsByDay, isTaskOnDay, useTasks } from "@/entities/task"
import { useGoals } from "@/entities/goal"
import { getHabitCompletionsByDay, useHabits } from "@/entities/habit"
import { getLastNDays, getTodayKey } from "@/shared/lib/date"
import { getDateLocale, getWeekdayLabels, useLanguage, type TranslationKey } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { BrandMark } from "@/shared/ui/brand-mark"
import { WeeklyActivityChart, type WeeklyActivityPoint } from "@/shared/ui/weekly-activity-chart"
import { NAV_ITEMS } from "../model/navItems"

export function SidebarNav() {
  const { tasks } = useTasks()
  const { habits } = useHabits()
  const { goals } = useGoals()
  const { language, t } = useLanguage()

  const today = getTodayKey()
  // Tasks scheduled for today, not "all open tasks" (selectTodayTasks means
  // something else now — see entities/task/lib/selectTodayTasks.ts) —
  // this is specifically the "due today, done/total" reading the stat's
  // label implies.
  const tasksToday = tasks.filter(task => isTaskOnDay(task, today))
  // Nav badge counts — deliberately a different reading than the "due
  // today" stat below: a standing backlog size (all open tasks / all
  // goals), same numbers the Tasks/Goals pages' own headers already show.
  const openTasksCount = tasks.filter(task => !task.completed).length

  const stats: { labelKey: TranslationKey; value: string }[] = [
    {
      labelKey: "sidebar.statTasksDone",
      value: `${tasksToday.filter(t => t.completed).length} / ${tasksToday.length}`,
    },
    {
      labelKey: "sidebar.statHabits",
      value: `${habits.filter(h => h.completedDates.includes(today)).length} / ${habits.length}`,
    },
    { labelKey: "sidebar.statActiveGoals", value: String(goals.length) },
  ]

  const last7Days = getLastNDays(7, new Date())
  const taskCounts = getTaskCompletionsByDay(tasks, last7Days)
  const habitCounts = getHabitCompletionsByDay(habits, last7Days)
  const weekdayLabels = getWeekdayLabels(language)
  const chartData: WeeklyActivityPoint[] = last7Days.map((day, i) => ({
    label: weekdayLabels[(day.getDay() + 6) % 7],
    value: taskCounts[i] + habitCounts[i],
  }))

  const badgeCounts: Partial<Record<string, number>> = {
    "/tasks": openTasksCount,
    "/goals": goals.length,
  }

  return (
    <aside className="hidden md:flex w-[264px] shrink-0 flex-col bg-sidebar border-r border-sidebar-border px-4 py-6">
      <div className="flex items-center gap-3 px-2 pt-1 pb-7">
        <BrandMark size={36} iconSize={20} radius={10} />
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-[-0.01em]">MyTracker</span>
          <span className="text-xs text-tertiary">
            {format(new Date(), "MMMM yyyy", { locale: getDateLocale(language) })}
          </span>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ path, labelKey, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex h-10 items-center gap-3 rounded-[10px] px-3 text-[15px] transition-colors ${
                isActive ? "bg-primary-soft text-primary font-semibold" : "text-muted-foreground font-medium"
              }`
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            <span className="flex-1">{t(labelKey)}</span>
            {badgeCounts[path] !== undefined && (
              <span className="text-xs font-semibold text-tertiary">{badgeCounts[path]}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <section className="flex flex-col gap-4 mt-7 pt-5 border-t border-border">
        <div className="bg-card border border-card-border rounded-xl shadow-card px-3.5 pt-3.5 pb-2.5 flex flex-col gap-2">
          <span className="text-xs font-bold tracking-[0.06em] uppercase text-tertiary">
            {t("sidebar.statChartLabel")}
          </span>
          <WeeklyActivityChart data={chartData} />
        </div>

        <div className="flex flex-col gap-2.5 px-1.5">
          <span className="text-xs font-bold tracking-[0.06em] uppercase text-tertiary">
            {t("common.today")}
          </span>
          {stats.map(({ labelKey, value }) => (
            <div key={labelKey} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t(labelKey)}</span>
              <span css={monoFont} className="text-sm font-semibold">
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}

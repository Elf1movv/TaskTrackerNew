import { format, isSameDay, isToday } from "date-fns"
import { useCategories } from "@/entities/category"
import { isGoalDueOnDay, type Goal } from "@/entities/goal"
import { selectRemindersOnDay, type Reminder } from "@/entities/reminder"
import { isTaskOnDay, type Task as DeadlineTask } from "@/entities/task"
import { isPlanOnDay, type CalendarEntry as Plan } from "@/entities/calendar-plan"
import type { MonthGridDay } from "@/shared/lib/calendarGrid"
import { getWeekdayLabels, useLanguage } from "@/shared/lib/i18n"
import { CalendarDayCell } from "./components"

export function CalendarGrid({
  days,
  tasks,
  deadlines = [],
  reminders,
  goals,
  selectedDay,
  onSelectDay,
  onMovePlanToDay,
  onEditPlan,
  onEditReminder,
}: {
  days: MonthGridDay[]
  tasks: Plan[]
  // Real tasks with a deadline (not calendar plans) — open ones only are
  // shown as small markers; see CalendarDayCell.
  deadlines?: DeadlineTask[]
  reminders: Reminder[]
  goals: Goal[]
  selectedDay: Date | null
  onSelectDay: (day: Date, isCurrentMonth: boolean) => void
  onMovePlanToDay: (taskId: string, day: Date) => void
  onEditPlan: (taskId: string, anchorRect: DOMRect) => void
  onEditReminder: (reminderId: string, anchorRect: DOMRect) => void
}) {
  const { language } = useLanguage()
  const { categories } = useCategories()

  return (
    <div className="bg-card border border-card-border rounded-xl shadow-card p-3">
      <div className="grid grid-cols-7 mb-1">
        {getWeekdayLabels(language).map(d => (
          <div
            key={d}
            className="tabular-nums text-center text-caption text-tertiary py-2 uppercase tracking-wider font-bold"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(({ date, isCurrentMonth }) => {
          const dayStr = format(date, "yyyy-MM-dd")
          const dayPlans = tasks.filter(t => isPlanOnDay(t, dayStr))
          const dayReminders = selectRemindersOnDay(reminders, dayStr)
          const dayGoals = goals.filter(g => isGoalDueOnDay(g, dayStr))
          const dayDeadlines = deadlines.filter(d => !d.completed && isTaskOnDay(d, dayStr))

          return (
            <CalendarDayCell
              key={dayStr}
              day={date}
              isCurrentMonth={isCurrentMonth}
              dayPlans={dayPlans}
              dayReminders={dayReminders}
              dayGoals={dayGoals}
              dayDeadlines={dayDeadlines}
              categories={categories}
              isSelected={selectedDay ? isSameDay(date, selectedDay) : false}
              isCurrent={isToday(date)}
              onSelect={() => onSelectDay(date, isCurrentMonth)}
              onMovePlanToDay={onMovePlanToDay}
              onEditPlan={onEditPlan}
              onEditReminder={onEditReminder}
            />
          )
        })}
      </div>
    </div>
  )
}

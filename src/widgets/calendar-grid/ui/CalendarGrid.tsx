import { format, isSameDay, isToday } from "date-fns"
import { isGoalDueOnDay, type Goal } from "@/entities/goal"
import { selectHabitsOnDay, type Habit } from "@/entities/habit"
import { selectRemindersOnDay, type Reminder } from "@/entities/reminder"
import { isTaskOnDay, type Task } from "@/entities/task"
import type { MonthGridDay } from "@/shared/lib/calendarGrid"
import { getWeekdayLabels, useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { CalendarDayCell } from "./components"

export function CalendarGrid({
  days,
  tasks,
  reminders,
  goals,
  habits,
  selectedDay,
  onSelectDay,
  onMoveTaskToDay,
  onMoveGoalToDay,
}: {
  days: MonthGridDay[]
  tasks: Task[]
  reminders: Reminder[]
  goals: Goal[]
  habits: Habit[]
  selectedDay: Date | null
  onSelectDay: (day: Date, isCurrentMonth: boolean) => void
  onMoveTaskToDay: (taskId: string, day: Date) => void
  onMoveGoalToDay: (goalId: string, day: Date) => void
}) {
  const { language } = useLanguage()

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {getWeekdayLabels(language).map(d => (
          <div
            key={d}
            css={monoFont}
            className="text-center text-[10px] text-muted-foreground py-2 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, isCurrentMonth }) => {
          const dayStr = format(date, "yyyy-MM-dd")
          const dayTasks = tasks.filter(t => isTaskOnDay(t, dayStr))
          const dayReminders = selectRemindersOnDay(reminders, dayStr)
          const dayGoals = goals.filter(g => isGoalDueOnDay(g, dayStr))
          const dayHabits = selectHabitsOnDay(habits, date)

          return (
            <CalendarDayCell
              key={dayStr}
              day={date}
              isCurrentMonth={isCurrentMonth}
              dayTasks={dayTasks}
              dayReminders={dayReminders}
              dayGoals={dayGoals}
              dayHabits={dayHabits}
              isSelected={selectedDay ? isSameDay(date, selectedDay) : false}
              isCurrent={isToday(date)}
              onSelect={() => onSelectDay(date, isCurrentMonth)}
              onMoveTaskToDay={onMoveTaskToDay}
              onMoveGoalToDay={onMoveGoalToDay}
            />
          )
        })}
      </div>
    </div>
  )
}

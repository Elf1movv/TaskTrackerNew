import { format, isSameDay, isToday } from "date-fns"
import { useCategories } from "@/entities/category"
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
  selectedDay,
  onSelectDay,
  onMoveTaskToDay,
  onMoveGoalToDay,
  onEditTask,
}: {
  days: MonthGridDay[]
  tasks: Task[]
  reminders: Reminder[]
  selectedDay: Date | null
  onSelectDay: (day: Date, isCurrentMonth: boolean) => void
  onMoveTaskToDay: (taskId: string, day: Date) => void
  onMoveGoalToDay: (goalId: string, day: Date) => void
  onEditTask: (taskId: string, anchorRect: DOMRect) => void
}) {
  const { language } = useLanguage()
  const { categories } = useCategories()

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

          return (
            <CalendarDayCell
              key={dayStr}
              day={date}
              isCurrentMonth={isCurrentMonth}
              dayTasks={dayTasks}
              dayReminders={dayReminders}
              categories={categories}
              isSelected={selectedDay ? isSameDay(date, selectedDay) : false}
              isCurrent={isToday(date)}
              onSelect={() => onSelectDay(date, isCurrentMonth)}
              onMoveTaskToDay={onMoveTaskToDay}
              onMoveGoalToDay={onMoveGoalToDay}
              onEditTask={onEditTask}
            />
          )
        })}
      </div>
    </div>
  )
}

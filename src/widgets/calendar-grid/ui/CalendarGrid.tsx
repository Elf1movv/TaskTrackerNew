import { format, isSameDay, isToday } from "date-fns"
import { isTaskOnDay, type Task } from "@/entities/task"
import { getWeekdayLabels, useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import type { MonthGridDay } from "../lib/buildMonthGrid"
import { CalendarDayCell } from "./components"

export function CalendarGrid({
  days,
  tasks,
  selectedDay,
  onSelectDay,
  onMoveTaskToDay,
}: {
  days: MonthGridDay[]
  tasks: Task[]
  selectedDay: Date | null
  onSelectDay: (day: Date, isCurrentMonth: boolean) => void
  onMoveTaskToDay: (taskId: string, day: Date) => void
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

          return (
            <CalendarDayCell
              key={dayStr}
              day={date}
              isCurrentMonth={isCurrentMonth}
              dayTasks={dayTasks}
              isSelected={selectedDay ? isSameDay(date, selectedDay) : false}
              isCurrent={isToday(date)}
              onSelect={() => onSelectDay(date, isCurrentMonth)}
              onMoveTaskToDay={onMoveTaskToDay}
            />
          )
        })}
      </div>
    </div>
  )
}

import { format, isSameDay, isToday } from "date-fns"
import { isTaskOnDay, type Task } from "@/entities/task"
import { getWeekdayLabels, useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { CalendarDayCell } from "./components"

export function CalendarGrid({
  days,
  startPad,
  tasks,
  selectedDay,
  onSelectDay,
  onMoveTaskToDay,
}: {
  days: Date[]
  startPad: number
  tasks: Task[]
  selectedDay: Date
  onSelectDay: (day: Date) => void
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
        {Array.from({ length: startPad }, (_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map(day => {
          const dayStr = format(day, "yyyy-MM-dd")
          const dayTasks = tasks.filter(t => isTaskOnDay(t, dayStr))

          return (
            <CalendarDayCell
              key={dayStr}
              day={day}
              dayTasks={dayTasks}
              isSelected={isSameDay(day, selectedDay)}
              isCurrent={isToday(day)}
              onSelect={() => onSelectDay(day)}
              onMoveTaskToDay={onMoveTaskToDay}
            />
          )
        })}
      </div>
    </div>
  )
}

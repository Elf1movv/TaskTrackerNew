import { format, isSameDay, isToday } from "date-fns"
import { type Task } from "@/entities/task"
import { monoFont } from "@/shared/lib/typography"
import { CalendarDayCell } from "./components"

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

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
  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
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
          const dayTasks = tasks.filter(t => t.dueDate === dayStr)

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

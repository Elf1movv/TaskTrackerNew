import { format, isSameDay, isToday } from "date-fns"
import { PriorityDot, type Task } from "@/entities/task"
import { monoFont } from "@/shared/lib/typography"

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

export function CalendarGrid({
  days,
  startPad,
  tasks,
  selectedDay,
  onSelectDay,
}: {
  days: Date[]
  startPad: number
  tasks: Task[]
  selectedDay: Date
  onSelectDay: (day: Date) => void
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
          const isSelected = isSameDay(day, selectedDay)
          const isCurrent = isToday(day)

          return (
            <button
              key={dayStr}
              onClick={() => onSelectDay(day)}
              className={`aspect-square rounded-xl flex flex-col items-center pt-2 text-sm transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isCurrent
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent text-foreground"
              }`}
            >
              <span css={monoFont} className="text-xs">
                {format(day, "d")}
              </span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center px-1">
                  {dayTasks.slice(0, 3).map(t => (
                    <PriorityDot
                      key={t.id}
                      priority={t.priority}
                      size={4}
                      colorOverride={isSelected ? "rgba(255,255,255,0.65)" : undefined}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

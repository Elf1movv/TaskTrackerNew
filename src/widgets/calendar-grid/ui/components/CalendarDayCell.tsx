import { useCallback } from "react"
import { format } from "date-fns"
import type { Reminder } from "@/entities/reminder"
import { PriorityDot, type Task } from "@/entities/task"
import { useDropTarget } from "@/shared/lib/dnd"
import { monoFont } from "@/shared/lib/typography"

// Shown inline on the cell without a tap — up to this many, the rest is
// summarized as "+N" (an unbounded list would blow up one busy day's row
// height for the whole grid, since all cells in a CSS Grid row share the
// tallest one's height).
const MAX_VISIBLE_REMINDERS = 2

export function CalendarDayCell({
  day,
  isCurrentMonth,
  dayTasks,
  dayReminders,
  isSelected,
  isCurrent,
  onSelect,
  onMoveTaskToDay,
}: {
  day: Date
  isCurrentMonth: boolean
  dayTasks: Task[]
  dayReminders: Reminder[]
  isSelected: boolean
  isCurrent: boolean
  onSelect: () => void
  onMoveTaskToDay: (taskId: string, day: Date) => void
}) {
  // Composed here (not passed down as a ready-made per-day closure from the
  // parent's .map()) so it stays referentially stable across renders where
  // `day` and `onMoveTaskToDay` don't change — useDropTarget's ref callback
  // depends on this identity staying stable, see useDropTarget's comment.
  const handleDrop = useCallback((taskId: string) => onMoveTaskToDay(taskId, day), [onMoveTaskToDay, day])
  const { ref, isOver } = useDropTarget<HTMLButtonElement>({
    type: "calendar-task-move",
    onDrop: handleDrop,
  })

  const visibleReminders = dayReminders.slice(0, MAX_VISIBLE_REMINDERS)
  const overflowCount = dayReminders.length - visibleReminders.length

  return (
    <button
      ref={ref}
      onClick={onSelect}
      // No longer aspect-square — reminder chips need room to show their
      // time+text inline without a tap (TickTick-style), so cells grow with
      // content instead of staying perfectly square.
      className={`min-h-[84px] rounded-xl border flex flex-col items-center gap-1 pt-2 pb-1.5 px-1 text-sm transition-all ${
        isSelected
          ? "bg-primary text-primary-foreground border-primary"
          : isCurrent
            ? "bg-primary/10 text-primary border-primary/30"
            : isCurrentMonth
              ? "border-border hover:bg-accent text-foreground"
              : "border-border/40 hover:bg-accent/50 text-muted-foreground/50"
      } ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <span css={monoFont} className="text-xs shrink-0">
        {format(day, "d")}
      </span>

      {visibleReminders.length > 0 && (
        <div className="w-full flex flex-col gap-0.5">
          {visibleReminders.map(reminder => (
            <div
              key={reminder.id}
              className={`w-full flex items-center gap-1 rounded px-1 py-0.5 text-[9px] leading-tight ${
                isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
              }`}
            >
              {reminder.time && (
                <span css={monoFont} className="shrink-0">
                  {reminder.time}
                </span>
              )}
              <span className="truncate">{reminder.title}</span>
            </div>
          ))}
          {overflowCount > 0 && (
            <div
              className={`text-[9px] px-1 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}
            >
              +{overflowCount}
            </div>
          )}
        </div>
      )}

      {dayTasks.length > 0 && (
        <div className="flex gap-0.5 flex-wrap justify-center px-1">
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
}

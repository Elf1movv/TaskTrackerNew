import { useCallback } from "react"
import { format } from "date-fns"
import { PriorityDot, type Task } from "@/entities/task"
import { useDropTarget } from "@/shared/lib/dnd"
import { monoFont } from "@/shared/lib/typography"

export function CalendarDayCell({
  day,
  dayTasks,
  isSelected,
  isCurrent,
  onSelect,
  onMoveTaskToDay,
}: {
  day: Date
  dayTasks: Task[]
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

  return (
    <button
      ref={ref}
      onClick={onSelect}
      className={`aspect-square rounded-xl flex flex-col items-center pt-2 text-sm transition-all ${
        isSelected
          ? "bg-primary text-primary-foreground"
          : isCurrent
            ? "bg-primary/10 text-primary"
            : "hover:bg-accent text-foreground"
      } ${isOver ? "ring-2 ring-primary" : ""}`}
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
}

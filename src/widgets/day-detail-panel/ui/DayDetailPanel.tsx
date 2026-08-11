import { format } from "date-fns"
import { TaskToggleCheckbox } from "@/features/toggle-task"
import { PriorityDot, type Task } from "@/entities/task"
import { displayFont, monoFont } from "@/shared/lib/typography"

export function DayDetailPanel({ day, tasks }: { day: Date; tasks: Task[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="mb-5">
        <div css={monoFont} className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
          {format(day, "EEEE")}
        </div>
        <div css={displayFont} className="text-2xl">
          {format(day, "MMMM d")}
        </div>
      </div>

      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="w-full flex items-center gap-2.5 text-left">
              <TaskToggleCheckbox taskId={task.id} completed={task.completed} size={16} />
              <span
                className={`text-sm flex-1 text-left leading-snug ${
                  task.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {task.title}
              </span>
              <PriorityDot priority={task.priority} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-8">No tasks scheduled</div>
      )}
    </div>
  )
}

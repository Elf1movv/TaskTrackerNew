import { TaskToggleCheckbox } from "@/features/toggle-task"
import type { Task } from "@/entities/task"
import { Badge } from "@/shared/ui/badge"
import { Progress } from "@/shared/ui/progress"
import { monoFont } from "@/shared/lib/typography"

export function TodayTasksCard({ tasks }: { tasks: Task[] }) {
  const done = tasks.filter(t => t.completed).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  return (
    <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span css={monoFont} className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
         Today's Tasks
        </span>
        <span css={monoFont} className="text-sm text-primary">
          {done}/{tasks.length} done
        </span>
      </div>

      <Progress value={pct} className="h-1 mb-6" />

      <div className="space-y-3.5">
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">No tasks for today</p>
        )}
        {tasks.map(task => (
          <div key={task.id} className="w-full flex items-center gap-3 text-left">
            <TaskToggleCheckbox taskId={task.id} completed={task.completed} />
            <span
              className={`text-sm flex-1 leading-snug transition-colors ${
                task.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {task.title}
            </span>
            <Badge variant="secondary" className="hidden sm:inline-flex shrink-0">
              {task.category}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

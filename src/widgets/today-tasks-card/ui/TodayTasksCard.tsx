import { useState } from "react"
import { TaskForm } from "@/features/task-form"
import type { Task } from "@/entities/task"
import { useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { Progress } from "@/shared/ui/progress"
import { TodayTaskRow } from "./components"

export function TodayTasksCard({ tasks }: { tasks: Task[] }) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const { t } = useLanguage()
  const done = tasks.filter(t => t.completed).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  return (
    <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span css={monoFont} className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
          {t("today.title")}
        </span>
        <span css={monoFont} className="text-sm text-primary">
          {t("today.doneCount", { done, total: tasks.length })}
        </span>
      </div>

      <Progress value={pct} className="h-1 mb-6" />

      <div className="space-y-3.5">
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">{t("today.noTasksToday")}</p>
        )}
        {tasks.map(task =>
          editingTaskId === task.id ? (
            <TaskForm key={task.id} task={task} onDone={() => setEditingTaskId(null)} />
          ) : (
            <TodayTaskRow key={task.id} task={task} onEdit={() => setEditingTaskId(task.id)} />
          ),
        )}
      </div>
    </div>
  )
}

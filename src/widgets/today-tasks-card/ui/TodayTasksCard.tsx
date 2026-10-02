import { ClipboardCheck } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"
import { TaskForm } from "@/features/task-form"
import type { Task } from "@/entities/task"
import { useLanguage } from "@/shared/lib/i18n"
import { Progress } from "@/shared/ui/progress"
import { TodayTaskRow } from "./components"

export function TodayTasksCard({ tasks }: { tasks: Task[] }) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const { t } = useLanguage()
  const done = tasks.filter(t => t.completed).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  return (
    <div className="lg:col-span-2 bg-card border border-card-border rounded-xl shadow-card overflow-hidden">
      <div className="px-6 pt-5 pb-4 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-[-0.015em]">{t("today.title")}</h2>
          <span className="text-sm font-semibold text-muted-foreground">
            {t("today.doneCount", { done, total: tasks.length })}
          </span>
        </div>
        <Progress value={pct} className="h-1.5 bg-fill" />
      </div>

      {tasks.length === 0 ? (
        <div className="border-t border-border px-6 py-10 flex flex-col items-center gap-2.5 text-center">
          <span className="size-12 rounded-[14px] bg-primary-soft text-primary flex items-center justify-center">
            <ClipboardCheck size={22} strokeWidth={1.75} />
          </span>
          <span className="text-[17px] font-bold">{t("today.noTasksToday")}</span>
        </div>
      ) : (
        <div className="flex flex-col">
          {tasks.map(task =>
            editingTaskId === task.id ? (
              <div key={task.id} className="border-t border-border px-6 py-4">
                <TaskForm task={task} onDone={() => setEditingTaskId(null)} />
              </div>
            ) : (
              <TodayTaskRow key={task.id} task={task} onEdit={() => setEditingTaskId(task.id)} />
            ),
          )}
        </div>
      )}
      <div className="border-t border-border px-6 py-3">
        <Link to="/tasks" className="text-sm font-semibold text-primary hover:underline">
          {t("today.allTasks")} →
        </Link>
      </div>
    </div>
  )
}

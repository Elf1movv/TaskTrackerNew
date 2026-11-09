import { Flag } from "lucide-react"
import { useNavigate } from "react-router"
import { resolveCategoryColor, useCategories } from "@/entities/category"
import type { Task } from "@/entities/task"
import { TaskToggleCheckbox } from "@/features/toggle-task"
import { useLanguage } from "@/shared/lib/i18n"

// A task's deadline on this day (iteration 3). Deliberately read-only apart
// from the checkbox: a deadline is not a calendar block, so it can't be
// dragged or resized here — the task itself is edited on the Tasks page.
export function DayDeadlineRow({ task }: { task: Task }) {
  const { categories } = useCategories()
  const { t } = useLanguage()
  const navigate = useNavigate()
  return (
    <div data-deadline-row={task.id} className="w-full flex items-center gap-2.5 text-left">
      <TaskToggleCheckbox taskId={task.id} completed={task.completed} size={22} />
      <Flag
        size={13}
        strokeWidth={2}
        className="shrink-0"
        style={{ color: resolveCategoryColor(task.category, categories) }}
      />
      <button
        type="button"
        onClick={() => navigate(`/tasks?task=${task.id}`)}
        title={t("calendar.openTasks")}
        className={`text-sm font-semibold flex-1 text-left leading-snug hover:underline ${
          task.completed ? "line-through text-tertiary" : ""
        }`}
      >
        {task.title}
      </button>
    </div>
  )
}

import { Trash2 } from "lucide-react"
import { useTasks } from "@/entities/task"
import { useLanguage } from "@/shared/lib/i18n"
import { ConfirmAction } from "@/shared/ui/confirm-action"

// Asks first, like every other delete (decision 8 of the 2026-11-09 audit).
export function DeleteTaskButton({ taskId, taskTitle }: { taskId: string; taskTitle: string }) {
  const { deleteTask } = useTasks()
  const { t } = useLanguage()

  return (
    <ConfirmAction
      title={t("delete.taskTitle")}
      description={t("delete.taskBody", { title: taskTitle })}
      onConfirm={() => deleteTask(taskId)}
    >
      <button
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition"
        aria-label="Delete task"
      >
        <Trash2 size={13} />
      </button>
    </ConfirmAction>
  )
}

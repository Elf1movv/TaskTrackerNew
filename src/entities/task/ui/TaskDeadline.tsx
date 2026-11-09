import type { Task } from "../model/task"
import { formatDay, useLanguage } from "@/shared/lib/i18n"
// The task's deadline as plain text ("Срок: …"); nothing for an undated task.
export function TaskDeadline({ task }: { task: Task }) {
  const { language, t } = useLanguage()
  return task.dueDate ? (
    <span className="text-xs text-muted-foreground">
      {t("tasks.date.label")}: {formatDay(task.dueDate, language)}
    </span>
  ) : null
}

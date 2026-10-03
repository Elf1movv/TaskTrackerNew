import type { Task } from "../model/task"
import { useLanguage } from "@/shared/lib/i18n"
export function TaskScheduleLink({ task }: { task: Task }) {
  const { t } = useLanguage()
  return task.dueDate ? (
    <span className="text-xs text-muted-foreground">
      {t("tasks.date.label")}: {task.dueDate}
    </span>
  ) : null
}

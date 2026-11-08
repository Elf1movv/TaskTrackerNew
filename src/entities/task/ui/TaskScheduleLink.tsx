import type { Task } from "../model/task"
import { formatDay, useLanguage } from "@/shared/lib/i18n"
export function TaskScheduleLink({ task }: { task: Task }) {
  const { language, t } = useLanguage()
  return task.dueDate ? (
    <span className="text-xs text-muted-foreground">
      {t("tasks.date.label")}: {formatDay(task.dueDate, language)}
    </span>
  ) : null
}

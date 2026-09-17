import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { format } from "date-fns"
import { Plus } from "lucide-react"
import { TaskForm } from "@/features/task-form"
import { type Task } from "@/entities/task"
import { formatDateKey } from "@/shared/lib/date"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { displayFont, monoFont } from "@/shared/lib/typography"
import { Button } from "@/shared/ui/button"
import { DayTaskRow } from "./components"

export function DayDetailPanel({ day, tasks }: { day: Date; tasks: Task[] }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const { language, t } = useLanguage()
  const locale = getDateLocale(language)
  const dueDate = formatDateKey(day)

  return (
    <div className="bg-card border border-border rounded-2xl p-5 min-w-0">
      <div className="flex items-start justify-between gap-2 mb-5">
        <div>
          <div css={monoFont} className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            {format(day, "EEEE", { locale })}
          </div>
          <div css={displayFont} className="text-2xl">
            {format(day, "MMMM d", { locale })}
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-xl text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => {
            setEditingTaskId(null)
            setIsAdding(v => !v)
          }}
          aria-label="Add task"
        >
          <Plus size={16} />
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden mb-4"
          >
            <TaskForm defaultDueDate={dueDate} onDone={() => setIsAdding(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map(task =>
            editingTaskId === task.id ? (
              <TaskForm key={task.id} task={task} onDone={() => setEditingTaskId(null)} />
            ) : (
              <DayTaskRow
                key={task.id}
                task={task}
                onEdit={() => {
                  setIsAdding(false)
                  setEditingTaskId(task.id)
                }}
              />
            ),
          )}
        </div>
      ) : (
        !isAdding && (
          <div className="text-sm text-muted-foreground text-center py-8">
            {t("calendar.noTasksScheduled")}
          </div>
        )
      )}
    </div>
  )
}

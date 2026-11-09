import { useState } from "react"
import { useCategories } from "@/entities/category"
import { PRIORITY_COLORS, useTasks, type Priority, type Task } from "@/entities/task"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage, type TranslationKey } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { DateTimeField } from "@/shared/ui/date-time-field"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Textarea } from "@/shared/ui/textarea"

const PRIORITIES: Priority[] = ["low", "medium", "high"]
const PRIORITY_LABEL_KEYS: Record<Priority, TranslationKey> = {
  low: "taskForm.low",
  medium: "taskForm.medium",
  high: "taskForm.high",
}

function nextPriority(current: Priority): Priority {
  return PRIORITIES[(PRIORITIES.indexOf(current) + 1) % PRIORITIES.length]
}

// Handles both creating a new task and editing an existing one — pass
// `task` to pre-fill the fields and save via update instead of create.
// `lockedCategory` is for create mode only: when set, the new task is
// silently created in that category and the category picker is hidden —
// used when adding a task from a specific category tab (e.g. Health) so it
// lands back in that same tab. Editing always shows the full picker.
//
// A task date is a deadline; calendar plans are independent records.
//
// `draft` pre-fills a NEW task (e.g. from a note being moved to tasks), and
// `onCreate` replaces the default addTask call for that case — the caller
// saves the task its own way and returns false to keep the form open on
// failure. Editing an existing task ignores both.
export type TaskDraftFields = Omit<Task, "id" | "updatedAt" | "completedAt" | "createdAt">
export function TaskForm({
  task,
  draft,
  lockedCategory,
  defaultDueDate,
  embedded,
  onCreate,
  onDelete,
  onDone,
}: {
  task?: Task
  draft?: { title: string; description: string | null }
  lockedCategory?: string
  defaultDueDate?: string
  embedded?: boolean
  onCreate?: (fields: TaskDraftFields) => Promise<boolean>
  onDelete?: () => void
  onDone: () => void
}) {
  const { addTask, updateTask } = useTasks()
  const { categories } = useCategories()
  const { t } = useLanguage()
  const [title, setTitle] = useState(task?.title ?? draft?.title ?? "")
  const [description, setDescription] = useState(task?.description ?? draft?.description ?? "")
  const [saving, setSaving] = useState(false)
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium")
  const [category, setCategory] = useState(task?.category ?? lockedCategory ?? categories[0]?.name ?? "")
  const [hasDueDate, setHasDueDate] = useState(task ? !!task.dueDate : !!defaultDueDate)
  const [dueDate, setDueDate] = useState(task?.dueDate ?? defaultDueDate ?? getTodayKey())
  const showCategoryPicker = !!task || !lockedCategory

  // Preserve the draft when a caller changes the suggested deadline.
  // An existing task always keeps its own deadline.
  const [previousDefaultDueDate, setPreviousDefaultDueDate] = useState(defaultDueDate)
  if (previousDefaultDueDate !== defaultDueDate) {
    setPreviousDefaultDueDate(defaultDueDate)
    if (!task && defaultDueDate) {
      setHasDueDate(true)
      setDueDate(defaultDueDate)
    }
  }

  async function handleSubmit() {
    if (!title.trim() || saving) return
    const patch = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      category,
      dueDate: hasDueDate ? dueDate : null,
      // Tasks have no hour since the redesign — schedules are calendar
      // plans. Saving an old task clears its leftover hour; the original is
      // kept in the LegacyTransition journal (release_cleanup migration).
      // The columns themselves are dropped in the release after main.
      time: null,
      endTime: null,
    }
    if (task) {
      updateTask(task.id, { ...patch, completed: task.completed })
    } else if (onCreate) {
      setSaving(true)
      const saved = await onCreate({ ...patch, completed: false })
      setSaving(false)
      if (!saved) return
    } else {
      addTask({ ...patch, completed: false })
    }
    onDone()
  }

  return (
    <div className={embedded ? "space-y-4" : "bg-card border border-primary/25 rounded-2xl p-5 space-y-4"}>
      <Input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === "Enter" && void handleSubmit()}
        placeholder={t("taskForm.placeholder")}
        className="border-0 border-b border-border rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary"
      />

      <Textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder={t("taskForm.descriptionPlaceholder")}
        className="text-sm min-h-16 resize-none"
      />

      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("taskForm.priority")}</span>
          <button
            type="button"
            // Always styled as "active" for its current value — same cycling-button
            // pattern as language-toggle.tsx/theme-toggle.tsx, with a per-priority
            // color (from data, so it stays an inline style)
            style={{
              borderColor: PRIORITY_COLORS[priority],
              color: PRIORITY_COLORS[priority],
            }}
            onClick={() => setPriority(nextPriority(priority))}
            className="px-2.5 py-1 rounded-lg text-xs capitalize transition border"
          >
            {t(PRIORITY_LABEL_KEYS[priority])}
          </button>
        </div>

        {showCategoryPicker ? (
          <div className="flex items-center gap-2">
            <Label htmlFor="task-category" className="text-xs text-muted-foreground font-normal">
              {t("taskForm.category")}
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="task-category" size="sm" className="text-xs h-8 w-auto bg-muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("taskForm.category")}</span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-muted">{category}</span>
          </div>
        )}

        <DateTimeField
          date={hasDueDate ? dueDate : null}
          onDateChange={d => {
            if (d) {
              setHasDueDate(true)
              setDueDate(d)
            } else {
              setHasDueDate(false)
            }
          }}
          placeholder={t("taskForm.noDueDate")}
        />
      </div>

      <div className="flex gap-2 justify-between pt-1">
        {onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-xs text-destructive">
            {t("common.delete")}
          </Button>
        )}
        <div className="flex gap-2 justify-end ml-auto">
          <Button variant="ghost" size="sm" onClick={onDone} className="text-xs">
            {t("common.cancel")}
          </Button>
          <Button size="sm" disabled={saving} onClick={() => void handleSubmit()} className="text-xs">
            {task ? t("common.save") : t("tasks.addTask")}
          </Button>
        </div>
      </div>
    </div>
  )
}

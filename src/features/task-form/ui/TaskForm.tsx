import { useState } from "react"
import styled from "@emotion/styled"
import { useCategories } from "@/entities/category"
import { PRIORITY_COLORS, useTasks, type Priority, type Task } from "@/entities/task"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage, type TranslationKey } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { DatePicker } from "@/shared/ui/date-picker"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

const PRIORITIES: Priority[] = ["low", "medium", "high"]
const PRIORITY_LABEL_KEYS: Record<Priority, TranslationKey> = {
  low: "taskForm.low",
  medium: "taskForm.medium",
  high: "taskForm.high",
}

function nextPriority(current: Priority): Priority {
  return PRIORITIES[(PRIORITIES.indexOf(current) + 1) % PRIORITIES.length]
}

// Always styled as "active" for its current value — same cycling-button
// pattern as language-toggle.tsx/theme-toggle.tsx, just with a per-value
// color instead of a fixed one.
const PriorityToggle = styled.button<{ color: string }>`
  border-color: ${p => p.color};
  background-color: ${p => `${p.color}28`};
  color: ${p => p.color};
`

// Handles both creating a new task and editing an existing one — pass
// `task` to pre-fill the fields and save via update instead of create.
// `lockedCategory` is for create mode only: when set, the new task is
// silently created in that category and the category picker is hidden —
// used when adding a task from a specific category tab (e.g. Health) so it
// lands back in that same tab. Editing always shows the full picker.
export function TaskForm({
  task,
  lockedCategory,
  defaultDueDate,
  onDone,
}: {
  task?: Task
  lockedCategory?: string
  defaultDueDate?: string
  onDone: () => void
}) {
  const { addTask, updateTask } = useTasks()
  const { categories, addCategory } = useCategories()
  const { t } = useLanguage()
  const [title, setTitle] = useState(task?.title ?? "")
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium")
  const [category, setCategory] = useState(task?.category ?? lockedCategory ?? categories[0]?.name ?? "")
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [hasDueDate, setHasDueDate] = useState(!!(task?.dueDate ?? defaultDueDate))
  const [dueDate, setDueDate] = useState(task?.dueDate ?? defaultDueDate ?? getTodayKey())
  const showCategoryPicker = !!task || !lockedCategory

  function handleCreateCategory() {
    const name = newCategoryName.trim()
    if (!name) return
    addCategory(name)
    setCategory(name)
    setNewCategoryName("")
    setIsAddingCategory(false)
  }

  function handleSubmit() {
    if (!title.trim()) return
    const patch = { title: title.trim(), priority, category, dueDate: hasDueDate ? dueDate : null }
    if (task) {
      updateTask(task.id, { ...patch, completed: task.completed })
    } else {
      addTask({ ...patch, completed: false })
    }
    onDone()
  }

  return (
    <div className="bg-card border border-primary/25 rounded-2xl p-5 space-y-4">
      <Input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSubmit()}
        placeholder={t("taskForm.placeholder")}
        className="border-0 border-b border-border rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary"
      />

      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("taskForm.priority")}</span>
          <PriorityToggle
            type="button"
            color={PRIORITY_COLORS[priority]}
            onClick={() => setPriority(nextPriority(priority))}
            className="px-2.5 py-1 rounded-lg text-xs capitalize transition-all border"
          >
            {t(PRIORITY_LABEL_KEYS[priority])}
          </PriorityToggle>
        </div>

        {showCategoryPicker ? (
          <div className="flex items-center gap-2">
            <Label htmlFor="task-category" className="text-xs text-muted-foreground font-normal">
              {t("taskForm.category")}
            </Label>
            {isAddingCategory ? (
              <div className="flex items-center gap-1.5">
                <Input
                  autoFocus
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleCreateCategory()
                    if (e.key === "Escape") setIsAddingCategory(false)
                  }}
                  placeholder={t("taskForm.newCategoryPlaceholder")}
                  className="text-xs h-8 w-32"
                />
                <Button type="button" size="sm" className="text-xs h-8" onClick={handleCreateCategory}>
                  {t("common.add")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setIsAddingCategory(false)}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            ) : (
              <Select
                value={category}
                onValueChange={v => (v === "__new__" ? setIsAddingCategory(true) : setCategory(v))}
              >
                <SelectTrigger id="task-category" size="sm" className="text-xs h-8 w-auto bg-muted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">{t("taskForm.newCategoryOption")}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("taskForm.category")}</span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-muted">{category}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => {
              const next = !hasDueDate
              setHasDueDate(next)
              if (next && !dueDate) setDueDate(getTodayKey())
            }}
          >
            {hasDueDate ? t("taskForm.hasDueDate") : t("taskForm.noDueDate")}
          </Button>
          {hasDueDate && <DatePicker value={dueDate} onChange={setDueDate} />}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={onDone} className="text-xs">
          {t("common.cancel")}
        </Button>
        <Button size="sm" onClick={handleSubmit} className="text-xs">
          {task ? t("common.save") : t("tasks.addTask")}
        </Button>
      </div>
    </div>
  )
}

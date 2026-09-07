import { useState } from "react"
import styled from "@emotion/styled"
import { PRIORITY_COLORS, TASK_CATEGORIES, useTasks, type Priority, type Task } from "@/entities/task"
import { getTodayKey } from "@/shared/lib/date"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

const PRIORITIES: Priority[] = ["low", "medium", "high"]

const PriorityOption = styled.button<{ active: boolean; color: string }>`
  border-color: ${p => (p.active ? p.color : "var(--border)")};
  background-color: ${p => (p.active ? `${p.color}28` : "transparent")};
  color: ${p => (p.active ? p.color : "var(--muted-foreground)")};
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
  const [title, setTitle] = useState(task?.title ?? "")
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium")
  const [category, setCategory] = useState(task?.category ?? lockedCategory ?? TASK_CATEGORIES[0])
  const [dueDate, setDueDate] = useState(task?.dueDate ?? defaultDueDate ?? getTodayKey())
  const showCategoryPicker = !!task || !lockedCategory

  function handleSubmit() {
    if (!title.trim()) return
    const patch = { title: title.trim(), priority, category, dueDate: dueDate || null }
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
        placeholder="What needs to be done?"
        className="border-0 border-b border-border rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary"
      />

      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Priority</span>
          {PRIORITIES.map(p => (
            <PriorityOption
              key={p}
              type="button"
              active={priority === p}
              color={PRIORITY_COLORS[p]}
              onClick={() => setPriority(p)}
              className="px-2.5 py-1 rounded-lg text-xs capitalize transition-all border"
            >
              {p}
            </PriorityOption>
          ))}
        </div>

        {showCategoryPicker ? (
          <div className="flex items-center gap-2">
            <Label htmlFor="task-category" className="text-xs text-muted-foreground font-normal">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="task-category" size="sm" className="text-xs h-8 w-auto bg-muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Category</span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-muted">{category}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Label htmlFor="task-due-date" className="text-xs text-muted-foreground font-normal">
            Due
          </Label>
          <Input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="text-xs px-2 py-1 h-8 w-auto rounded-lg bg-muted"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={onDone} className="text-xs">
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} className="text-xs">
          {task ? "Save" : "Add task"}
        </Button>
      </div>
    </div>
  )
}

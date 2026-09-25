import { useState } from "react"
import { TaskForm } from "@/features/task-form"
import { ReminderForm } from "@/features/reminder-form"
import { useReminders, type Reminder } from "@/entities/reminder"
import { useTasks, type Task } from "@/entities/task"
import { formatDateKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { Popover, PopoverAnchor, PopoverContent } from "@/shared/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"

export type CalendarItemDraft =
  | { mode: "create"; day: Date; defaultTime: string | null; defaultEndTime: string | null }
  | { mode: "edit-task"; task: Task }
  | { mode: "edit-reminder"; reminder: Reminder }

// The click/drag-anchored replacement for Day's old static sidebar — one
// popover that handles both creating a new task/reminder (anchored where
// the create-drag ended in the hour grid) and editing an existing one
// (anchored at the clicked block). Goals are deliberately absent from the
// type toggle: Day/Week give goals no CRUD at all, only their own page
// can create/edit them.
//
// Anchored via a Radix virtual reference (`PopoverAnchor`'s `virtualRef`)
// rather than a real DOM trigger element — there's no fixed "+" button
// this popover opens from, the anchor point is wherever the pointer
// gesture happened to end.
export function CalendarItemPopover({
  draft,
  anchorRect,
  onClose,
}: {
  draft: CalendarItemDraft | null
  anchorRect: DOMRect | null
  onClose: () => void
}) {
  const { t } = useLanguage()
  const { deleteTask } = useTasks()
  const { deleteReminder } = useReminders()
  const [type, setType] = useState<"task" | "reminder">("task")

  // A plain object, not a stored/mutated ref — anchorRect only changes
  // while the popover is closed (a new draft opens it fresh each time),
  // so a fresh virtual-anchor object built straight from the current
  // render is enough; there's no live-tracking-while-open case here that
  // would need a persisted, in-place-mutated ref.
  const anchorRef = { current: { getBoundingClientRect: () => anchorRect ?? new DOMRect() } }

  return (
    <Popover open={!!draft} onOpenChange={open => !open && onClose()}>
      <PopoverAnchor virtualRef={anchorRef} />
      <PopoverContent align="start" collisionPadding={12} className="w-80">
        {draft?.mode === "create" && (
          <>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={type}
              onValueChange={v => v && setType(v as "task" | "reminder")}
              className="mb-4"
            >
              <ToggleGroupItem value="task" className="text-xs flex-1">
                {t("calendar.typeTask")}
              </ToggleGroupItem>
              <ToggleGroupItem value="reminder" className="text-xs flex-1">
                {t("calendar.typeReminder")}
              </ToggleGroupItem>
            </ToggleGroup>
            {type === "task" ? (
              <TaskForm
                embedded
                startExpanded
                defaultDueDate={formatDateKey(draft.day)}
                defaultTime={draft.defaultTime}
                defaultEndTime={draft.defaultEndTime}
                onDone={onClose}
              />
            ) : (
              <ReminderForm
                embedded
                lockedDate={formatDateKey(draft.day)}
                defaultTime={draft.defaultTime}
                onDone={onClose}
              />
            )}
          </>
        )}

        {draft?.mode === "edit-task" && (
          <TaskForm
            embedded
            task={draft.task}
            onDone={onClose}
            onDelete={() => {
              deleteTask(draft.task.id)
              onClose()
            }}
          />
        )}

        {draft?.mode === "edit-reminder" && (
          <ReminderForm
            embedded
            reminder={draft.reminder}
            onDone={onClose}
            onDelete={() => {
              deleteReminder(draft.reminder.id)
              onClose()
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}

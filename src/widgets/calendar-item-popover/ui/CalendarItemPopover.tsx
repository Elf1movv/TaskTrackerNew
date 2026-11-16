import { useState } from "react"
import { PlanForm } from "@/features/plan-form"
import { ReminderForm } from "@/features/reminder-form"
import { useReminders, type Reminder } from "@/entities/reminder"
import type { CalendarEntry as Task } from "@/entities/calendar-plan"
import { formatDateKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"

export type CalendarItemDraft =
  | { mode: "create"; day: Date; defaultTime: string | null; defaultEndTime: string | null }
  | { mode: "edit-plan"; task: Task }
  | { mode: "edit-reminder"; reminder: Reminder }

// One window for creating a plan/reminder (after a click or drag on the hour
// grid / a day) and for editing one. Until 2026-11-15 it was a popover
// anchored where the gesture ended — it jumped around, scrolled away with the
// page, and on a phone the keyboard covered it (owner report). Now it's a
// regular Dialog: fixed in the middle of the visible screen, above the
// keyboard (see shared/ui/dialog.tsx). Goals are deliberately absent from the
// type toggle: only their own page creates/edits them.
export function CalendarItemPopover({
  draft,
  onClose,
}: {
  draft: CalendarItemDraft | null
  onClose: () => void
}) {
  const { t } = useLanguage()

  const { deleteReminder } = useReminders()
  const [type, setType] = useState<"task" | "reminder">("task")

  return (
    <Dialog open={!!draft} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle className="sr-only">
          {draft?.mode === "edit-reminder" ? t("calendar.typeReminder") : t("plans.title")}
        </DialogTitle>
        <DialogDescription className="sr-only">{t("plans.title")}</DialogDescription>
        {draft?.mode === "create" && (
          <>
            {/* pr-8: the window's close cross sits in the top-right corner
                and covered "Reminder" (owner, 2026-11-15). */}
            <div className="mb-4 pr-8">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={type}
                onValueChange={v => v && setType(v as "task" | "reminder")}
                className="w-full"
              >
                <ToggleGroupItem value="task" className="text-xs flex-1">
                  {t("plans.title")}
                </ToggleGroupItem>
                <ToggleGroupItem value="reminder" className="text-xs flex-1">
                  {t("calendar.typeReminder")}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            {type === "task" ? (
              <PlanForm
                embedded
                defaultDate={formatDateKey(draft.day)}
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

        {draft?.mode === "edit-plan" && <PlanForm embedded plan={draft.task} onDone={onClose} />}

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
      </DialogContent>
    </Dialog>
  )
}

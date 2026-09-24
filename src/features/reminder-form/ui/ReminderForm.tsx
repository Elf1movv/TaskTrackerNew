import { useState } from "react"
import styled from "@emotion/styled"
import {
  REMINDER_PRIORITY_COLORS,
  useReminders,
  type Reminder,
  type ReminderPriority,
} from "@/entities/reminder"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage, type TranslationKey } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { DatePicker } from "@/shared/ui/date-picker"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { TimePicker } from "@/shared/ui/time-picker"

const PRIORITIES: ReminderPriority[] = ["normal", "critical"]
const PRIORITY_LABEL_KEYS: Record<ReminderPriority, TranslationKey> = {
  normal: "reminderForm.priorityNormal",
  critical: "reminderForm.priorityCritical",
}

function nextPriority(current: ReminderPriority): ReminderPriority {
  return PRIORITIES[(PRIORITIES.indexOf(current) + 1) % PRIORITIES.length]
}

// Same cycling-toggle pattern as TaskForm's PriorityToggle, just over the
// two-value ReminderPriority instead of Task's three.
const PriorityToggle = styled.button<{ color: string }>`
  border-color: ${p => p.color};
  background-color: ${p => `${p.color}28`};
  color: ${p => p.color};
`

// Handles both creating a new reminder and editing an existing one — pass
// `reminder` to pre-fill and save via update instead of create.
// `lockedDate` is for create mode only: when set (e.g. adding from a
// specific day's panel on the calendar), the date picker is hidden and the
// reminder is created on that exact day — mirrors TaskForm's
// `lockedCategory`, just for date instead of category.
export function ReminderForm({
  reminder,
  lockedDate,
  defaultTime,
  embedded,
  onDelete,
  onDone,
}: {
  reminder?: Reminder
  lockedDate?: string
  defaultTime?: string | null
  embedded?: boolean
  onDelete?: () => void
  onDone: () => void
}) {
  const { addReminder, updateReminder } = useReminders()
  const { t } = useLanguage()
  const [title, setTitle] = useState(reminder?.title ?? "")
  const [date, setDate] = useState(reminder?.date ?? lockedDate ?? getTodayKey())
  const [time, setTime] = useState<string | null>(reminder?.time ?? defaultTime ?? null)
  const [priority, setPriority] = useState<ReminderPriority>(reminder?.priority ?? "normal")
  // `lockedDate` only streamlines quick-add from a specific day's panel —
  // it shouldn't also make an existing reminder's date permanently
  // unchangeable. Editing (`reminder` set) always shows the picker, so a
  // reminder created from one day's panel can still be moved to another.
  const showDatePicker = !lockedDate || !!reminder

  function handleSubmit() {
    if (!title.trim()) return
    const patch = { title: title.trim(), date, time, priority }
    if (reminder) {
      updateReminder(reminder.id, { ...patch, completed: reminder.completed })
    } else {
      addReminder({ ...patch, completed: false })
    }
    onDone()
  }

  return (
    <div className={embedded ? "space-y-4" : "bg-card border border-primary/25 rounded-2xl p-5 space-y-4"}>
      <Input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSubmit()}
        placeholder={t("reminderForm.placeholder")}
        className="border-0 border-b border-border rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary"
      />

      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("reminderForm.priority")}</span>
          <PriorityToggle
            type="button"
            color={REMINDER_PRIORITY_COLORS[priority]}
            onClick={() => setPriority(nextPriority(priority))}
            className="px-2.5 py-1 rounded-lg text-xs transition-all border"
          >
            {t(PRIORITY_LABEL_KEYS[priority])}
          </PriorityToggle>
        </div>

        {showDatePicker && (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground font-normal">{t("reminderForm.date")}</Label>
            <DatePicker value={date} onChange={setDate} />
          </div>
        )}

        <TimePicker value={time} onChange={setTime} />
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
          <Button size="sm" onClick={handleSubmit} className="text-xs">
            {reminder ? t("common.save") : t("reminders.addReminder")}
          </Button>
        </div>
      </div>
    </div>
  )
}

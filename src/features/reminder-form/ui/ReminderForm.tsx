import { useState } from "react"
import { useReminders, type Reminder } from "@/entities/reminder"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { DatePicker } from "@/shared/ui/date-picker"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

// Handles both creating a new reminder and editing an existing one — pass
// `reminder` to pre-fill and save via update instead of create.
// `lockedDate` is for create mode only: when set (e.g. adding from a
// specific day's panel on the calendar), the date picker is hidden and the
// reminder is created on that exact day — mirrors TaskForm's
// `lockedCategory`, just for date instead of category.
export function ReminderForm({
  reminder,
  lockedDate,
  onDone,
}: {
  reminder?: Reminder
  lockedDate?: string
  onDone: () => void
}) {
  const { addReminder, updateReminder } = useReminders()
  const { t } = useLanguage()
  const [title, setTitle] = useState(reminder?.title ?? "")
  const [date, setDate] = useState(reminder?.date ?? lockedDate ?? getTodayKey())
  const [time, setTime] = useState(reminder?.time ?? "")
  const showDatePicker = !lockedDate

  function handleSubmit() {
    if (!title.trim()) return
    const patch = { title: title.trim(), date, time: time || null }
    if (reminder) {
      updateReminder(reminder.id, { ...patch, completed: reminder.completed })
    } else {
      addReminder({ ...patch, completed: false })
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
        placeholder={t("reminderForm.placeholder")}
        className="border-0 border-b border-border rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary"
      />

      <div className="flex gap-4 flex-wrap items-center">
        {showDatePicker && (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground font-normal">{t("reminderForm.date")}</Label>
            <DatePicker value={date} onChange={setDate} />
          </div>
        )}
        <div className="flex items-center gap-2">
          <Label htmlFor="reminder-time" className="text-xs text-muted-foreground font-normal">
            {t("reminderForm.time")}
          </Label>
          <Input
            id="reminder-time"
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="text-xs h-8 w-auto bg-muted"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={onDone} className="text-xs">
          {t("common.cancel")}
        </Button>
        <Button size="sm" onClick={handleSubmit} className="text-xs">
          {reminder ? t("common.save") : t("reminders.addReminder")}
        </Button>
      </div>
    </div>
  )
}

import { useState } from "react"
import type { CalendarPlan } from "@/entities/calendar-plan"
import type { Task } from "@/entities/task"
import { useReminders } from "@/entities/reminder"
import { formatDateKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { DateTimeField } from "@/shared/ui/date-time-field"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
export function LinkedReminderForm({
  task,
  plan,
  onDone,
}: {
  task?: Task
  plan?: CalendarPlan
  onDone: () => void
}) {
  const { t } = useLanguage()
  const { addReminder } = useReminders()
  const [relative, setRelative] = useState(!!plan)
  const [offset, setOffset] = useState(30)
  const [date, setDate] = useState(plan?.date ?? task?.dueDate ?? formatDateKey(new Date()))
  const [time, setTime] = useState<string | null>(null)
  return (
    <div className="rounded-lg border border-border p-3 space-y-3">
      {plan && (
        <Button variant="outline" size="sm" onClick={() => setRelative(v => !v)}>
          {t(relative ? "reminder.beforePlan" : "reminder.atTime")}
        </Button>
      )}
      {relative ? (
        <label className="text-xs space-y-2 block">
          {t("reminder.relative")}
          <Input
            type="number"
            min={0}
            max={10080}
            value={offset}
            onChange={e => setOffset(Number(e.target.value))}
          />
        </label>
      ) : (
        <DateTimeField
          date={date}
          onDateChange={value => value && setDate(value)}
          clearable={false}
          time={time}
          onTimeChange={setTime}
        />
      )}
      {relative && plan && (plan.onHold || !plan.time) && (
        <p className="text-xs text-muted-foreground">{t("reminder.suspended")}</p>
      )}
      <Button
        size="sm"
        disabled={relative && (!Number.isInteger(offset) || offset < 0 || offset > 10080)}
        onClick={() => {
          addReminder({
            title: task?.title ?? plan?.title ?? "",
            date,
            time,
            priority: "normal",
            completed: false,
            taskId: task?.id ?? null,
            planId: plan?.id ?? null,
            offsetMinutes: relative ? offset : null,
          })
          onDone()
        }}
      >
        {t("common.save")}
      </Button>
    </div>
  )
}

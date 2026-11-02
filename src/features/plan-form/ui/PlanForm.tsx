import { useState } from "react"
import { usePlans, type CalendarPlan } from "@/entities/calendar-plan"
import { formatDateKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { minutesFromMidnight } from "@/shared/lib/timeOffset"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { DateTimeField } from "@/shared/ui/date-time-field"
import { ConfirmAction } from "@/shared/ui/confirm-action"
export function PlanForm({
  plan,
  defaultDate,
  defaultTime = null,
  defaultEndTime = null,
  embedded,
  onDone,
}: {
  plan?: CalendarPlan
  defaultDate?: string
  defaultTime?: string | null
  defaultEndTime?: string | null
  embedded?: boolean
  onDone: () => void
}) {
  const { t } = useLanguage()
  const { addPlan, updatePlan, deletePlan } = usePlans()
  const [title, setTitle] = useState(plan?.title ?? "")
  const [description, setDescription] = useState(plan?.description ?? "")
  const [date, setDate] = useState(plan ? plan.date : (defaultDate ?? formatDateKey(new Date())))
  const [time, setTime] = useState(plan ? plan.time : defaultTime)
  const [endTime, setEndTime] = useState(plan ? plan.endTime : defaultEndTime)
  const [onHold, setOnHold] = useState(plan?.onHold ?? false)
  const [saving, setSaving] = useState(false)
  const [previousDefault, setPreviousDefault] = useState(defaultDate)
  if (previousDefault !== defaultDate) {
    setPreviousDefault(defaultDate)
    if (!plan && defaultDate) {
      setDate(defaultDate)
      setOnHold(false)
    }
  }
  const invalidTime = !onHold && !!time && !!endTime && endTime <= time
  async function save() {
    if (saving || invalidTime || !title.trim() || (!onHold && !date)) return
    setSaving(true)
    const fields = {
      title: title.trim(),
      description: description.trim() || null,
      date: onHold ? null : date,
      time: onHold ? null : time,
      endTime: onHold || !time ? null : endTime,
      durationMinutes:
        time && endTime && endTime > time
          ? minutesFromMidnight(endTime) - minutesFromMidnight(time)
          : (plan?.durationMinutes ?? 60),
      onHold,
      completed: plan?.completed ?? false,
      category: plan?.category ?? "",
      priority: plan?.priority ?? ("medium" as const),
    }
    if (plan) updatePlan(plan.id, fields)
    else if (!(await addPlan(fields))) {
      setSaving(false)
      return
    }
    onDone()
  }
  return (
    <div className={embedded ? "space-y-4" : "bg-card border border-primary/25 rounded-xl p-5 space-y-4"}>
      <Input
        autoFocus
        placeholder={t("plans.add")}
        aria-label={t("plans.add")}
        maxLength={500}
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <Textarea
        placeholder={t("notes.description")}
        value={description}
        onChange={e => setDescription(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant={onHold ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setOnHold(v => !v)
            if (!date) setDate(defaultDate ?? formatDateKey(new Date()))
          }}
        >
          {t("plans.hold")}
        </Button>
        {!onHold && (
          <DateTimeField
            date={date}
            onDateChange={setDate}
            clearable={false}
            time={time}
            onTimeChange={value => {
              setTime(value)
              if (!value) setEndTime(null)
            }}
            endTime={endTime}
            onEndTimeChange={setEndTime}
          />
        )}
      </div>
      {invalidTime && <p className="text-xs text-destructive">{t("plans.invalidTime")}</p>}
      <div className="flex flex-wrap gap-2 justify-end">
        {plan && (
          <ConfirmAction
            confirmLabel={t("common.delete")}
            title={t("delete.planTitle")}
            description={t("plans.deleteBody")}
            onConfirm={() => {
              deletePlan(plan.id)
              onDone()
            }}
          >
            <Button variant="ghost" size="sm" className="mr-auto text-destructive">
              {t("common.delete")}
            </Button>
          </ConfirmAction>
        )}
        <Button variant="ghost" size="sm" onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button size="sm" disabled={saving || invalidTime || !title.trim()} onClick={() => void save()}>
          {t("common.save")}
        </Button>
      </div>
    </div>
  )
}

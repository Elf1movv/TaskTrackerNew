import { useEffect, useState } from "react"
import { parseISO } from "date-fns"
import { Plus } from "lucide-react"
import { usePlans, type CalendarEntry } from "@/entities/calendar-plan"
import { PlanForm } from "@/features/plan-form"
import { useLanguage } from "@/shared/lib/i18n"
import { useDropTarget } from "@/shared/lib/dnd"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { useMoveDrag } from "../lib/useMoveDrag"

export function PlanShelf({
  days,
  anchorDate,
  onReschedule,
}: {
  days: string[]
  anchorDate: string
  onReschedule: (id: string, day: Date, time: string | null) => void
}) {
  const { plans, updatePlan } = usePlans()
  const { t } = useLanguage()
  const [editing, setEditing] = useState<CalendarEntry | "new" | null>(null)
  const hold = (id: string) => updatePlan(id, { onHold: true, date: null, time: null, endTime: null })
  const { ref, isOver } = useDropTarget<HTMLDivElement>({ type: "calendar-task-move", onDrop: hold })
  useEffect(() => {
    const handle = (event: Event) => {
      const { id, day } = (event as CustomEvent<{ id: string; day?: string }>).detail
      if (day) onReschedule(id, parseISO(day), null)
      else updatePlan(id, { onHold: true, date: null, time: null, endTime: null })
    }
    window.addEventListener("calendar-plan-drop", handle)
    return () => window.removeEventListener("calendar-plan-drop", handle)
  }, [updatePlan, onReschedule])
  const held = plans.filter(plan => plan.onHold)
  const untimed = plans.filter(plan => !plan.onHold && !plan.time && !!plan.date && days.includes(plan.date))
  return (
    <div className="space-y-3 mb-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus size={15} />
          {t("plans.add")}
        </Button>
      </div>
      <div
        ref={ref}
        data-plan-hold
        className={`rounded-xl border border-dashed p-3 min-h-16 ${isOver ? "border-primary bg-primary-soft" : "border-border-strong bg-card"}`}
      >
        <h2 className="font-semibold text-sm mb-2">
          {t("plans.hold")} {held.length ? `· ${held.length}` : ""}
        </h2>
        {held.length ? (
          <div className="flex gap-2 flex-wrap">
            {held.map(plan => (
              <ShelfItem
                key={plan.id}
                plan={plan}
                onReschedule={onReschedule}
                onEdit={() => setEditing(plan)}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t("plans.holdHint")}</p>
        )}
      </div>
      {!!untimed.length && (
        <div className="rounded-xl border border-card-border bg-card p-3">
          <h2 className="font-semibold text-sm mb-2">{t("plans.untimed")}</h2>
          <div className="flex gap-2 flex-wrap">
            {untimed.map(plan => (
              <ShelfItem
                key={plan.id}
                plan={plan}
                onReschedule={onReschedule}
                onEdit={() => setEditing(plan)}
              />
            ))}
          </div>
        </div>
      )}
      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{t("plans.title")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <PlanForm
              key={editing === "new" ? "new" : editing.id}
              embedded
              plan={editing === "new" ? undefined : editing}
              defaultDate={anchorDate}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
function ShelfItem({
  plan,
  onReschedule,
  onEdit,
}: {
  plan: CalendarEntry
  onReschedule: (id: string, day: Date, time: string | null) => void
  onEdit: () => void
}) {
  const { onPointerDown, wasDraggedRef, isDragging } = useMoveDrag({
    taskId: plan.id,
    durationMinutes: plan.durationMinutes,
    onRescheduleTask: onReschedule,
    onPreviewChange: () => {},
  })
  return (
    <button
      onPointerDown={onPointerDown}
      onClick={() => {
        if (!wasDraggedRef.current) onEdit()
      }}
      className={`max-w-full rounded-lg border border-border px-3 py-2 text-xs text-left bg-muted cursor-grab touch-none ${plan.completed ? "opacity-60" : ""}`}
      style={{ opacity: isDragging ? 0.4 : undefined }}
    >
      <span className="[overflow-wrap:anywhere]">{plan.title}</span>
      {plan.date && <span className="ml-2 text-muted-foreground">{plan.date}</span>}
    </button>
  )
}

import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import { usePlans } from "@/entities/calendar-plan"
import type { Task } from "@/entities/task"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/ui/popover"
import { ConfirmAction } from "@/shared/ui/confirm-action"
import { PlanForm } from "./PlanForm"
import { LinkedReminderForm } from "./LinkedReminderForm"
export function TaskPlanning({ task }: { task: Task }) {
  const { t } = useLanguage()
  const { plans, refreshPlans } = usePlans()
  const [reminding, setReminding] = useState(false)
  const [open, setOpen] = useState(false)
  const linked = plans.filter(plan => plan.taskId === task.id)
  async function clearFuture() {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${task.id}/clear-future-plans`, {
      method: "POST",
      headers: { "X-Time-Zone": Intl.DateTimeFormat().resolvedOptions().timeZone },
    })
    if (!response.ok) {
      toast.error(t("transition.error"))
      return
    }
    await refreshPlans()
    window.dispatchEvent(new CustomEvent("collection-invalidated", { detail: ["reminder"] }))
  }
  return (
    <div className="mt-2 space-y-2" onPointerDown={e => e.stopPropagation()}>
      <div className="flex gap-2 flex-wrap">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              {t("plans.schedule")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 max-h-[80vh] overflow-auto">
            <PlanForm embedded defaultTaskId={task.id} onDone={() => setOpen(false)} />
          </PopoverContent>
        </Popover>
        <Popover open={reminding} onOpenChange={setReminding}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              {t("reminder.linkAction")}
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <LinkedReminderForm task={task} onDone={() => setReminding(false)} />
          </PopoverContent>
        </Popover>
      </div>
      {!!linked.length && (
        <div className="flex flex-wrap gap-2 text-xs">
          {linked.map(plan => (
            <Link
              key={plan.id}
              className="text-primary underline"
              to={`/calendar?view=day&date=${plan.date ?? new Date().toISOString().slice(0, 10)}&plan=${plan.id}`}
            >
              {plan.onHold
                ? t("plans.hold")
                : `${plan.date} ${plan.time ?? t("plans.untimed")}${plan.endTime ? `–${plan.endTime}` : ""}`}
            </Link>
          ))}
        </div>
      )}
      {task.completed && !!linked.length && (
        <ConfirmAction
          confirmLabel={t("plans.clearFuture")}
          title={t("plans.clearFuture")}
          description={t("plans.clearFutureBody")}
          onConfirm={() => void clearFuture()}
        >
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            {t("plans.clearFuture")}
          </Button>
        </ConfirmAction>
      )}
    </div>
  )
}

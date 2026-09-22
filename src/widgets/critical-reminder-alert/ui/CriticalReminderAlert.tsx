import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useReminders } from "@/entities/reminder"
import { useLanguage } from "@/shared/lib/i18n"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { buttonVariants } from "@/shared/ui/button"
import {
  checkCriticalThresholds,
  type CriticalAlert,
  type CriticalThreshold,
} from "../lib/checkCriticalThresholds"

const CHECK_INTERVAL_MS = 60_000

// userId-scoped, same reasoning as due-date-reminders' dedup key — a
// shared browser with two accounts must not let one account's shown
// alerts suppress the other's.
function storageKey(userId: string): string {
  return `mytracker-critical-alerts-shown-${userId}`
}

function readShown(userId: string): Record<string, CriticalThreshold[]> {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function markShown(userId: string, reminderId: string, threshold: CriticalThreshold) {
  try {
    const shown = readShown(userId)
    shown[reminderId] = [...(shown[reminderId] ?? []), threshold]
    localStorage.setItem(storageKey(userId), JSON.stringify(shown))
  } catch {
    // private browsing or similar — same silent no-op as due-date-reminders
  }
}

// Center-screen, must-acknowledge popup for critical-priority reminders —
// distinct from the due-date toast (which only ever nudges about
// tasks/goals, not this Reminder entity, and never interrupts). No push
// notifications exist in this app — this only fires while the tab is open,
// checked once a minute so an exact-time threshold isn't missed by much.
export function CriticalReminderAlert({ userId }: { userId: string }) {
  const { reminders } = useReminders()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [queue, setQueue] = useState<CriticalAlert[]>([])

  useEffect(() => {
    function check() {
      const critical = reminders.filter(r => r.priority === "critical" && !r.completed)
      const shown = readShown(userId)
      const newAlerts = checkCriticalThresholds(critical, shown, new Date())
      if (newAlerts.length === 0) return
      newAlerts.forEach(a => markShown(userId, a.reminder.id, a.threshold))
      setQueue(prev => [...prev, ...newAlerts])
    }

    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [reminders, userId])

  const active = queue[0]

  // The queue only ever advances here, via onOpenChange below — both
  // AlertDialogAction buttons close the dialog on click (Radix's built-in
  // behavior for that element), which is what fires this. Don't also call
  // it directly from a button's own onClick, or a click would advance the
  // queue twice in the same tick.
  function dismiss() {
    setQueue(prev => prev.slice(1))
  }

  if (!active) return null

  const whenLabel =
    active.threshold === "24h"
      ? t("reminders.criticalAlertIn24h")
      : active.threshold === "1h"
        ? t("reminders.criticalAlertIn1h")
        : t("reminders.criticalAlertToday")

  return (
    <AlertDialog open onOpenChange={open => !open && dismiss()}>
      <AlertDialogContent className="border-destructive border-2 shadow-[0_0_40px_-5px_rgba(201,80,58,0.5)]">
        <AlertDialogHeader>
          <AlertDialogTitle>{active.reminder.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {whenLabel}
            {active.reminder.time ? ` · ${active.reminder.time}` : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => navigate(`/calendar?date=${active.reminder.date}`)}
            className={buttonVariants({ variant: "outline" })}
          >
            {t("reminders.viewAction")}
          </AlertDialogAction>
          <AlertDialogAction>{t("reminders.criticalAlertAck")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

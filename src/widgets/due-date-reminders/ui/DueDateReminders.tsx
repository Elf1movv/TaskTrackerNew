import { useEffect } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { useGoals } from "@/entities/goal"
import { useTasks } from "@/entities/task"
import { isDueSoonOrOverdue, getTodayKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"

const STORAGE_KEY_PREFIX = "mytracker-reminders-shown-"

interface ShownToday {
  tasks?: boolean
  goals?: boolean
}

// Keyed by user id, not just date — a shared browser with two different
// accounts logged in on the same day must not let the first account's
// toast silently suppress the second account's.
function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}-${getTodayKey()}`
}

function readShownToday(userId: string): ShownToday {
  try {
    const stored = localStorage.getItem(storageKey(userId))
    return stored ? (JSON.parse(stored) as ShownToday) : {}
  } catch {
    return {}
  }
}

function markShownToday(userId: string, patch: ShownToday) {
  try {
    const current = readShownToday(userId)
    localStorage.setItem(storageKey(userId), JSON.stringify({ ...current, ...patch }))
  } catch {
    // localStorage can throw in private/blocked-storage contexts — the
    // reminder just won't be deduped across reloads this session.
  }
}

// No visible UI — mounted once in RootLayout purely to check, on load, for
// tasks/goals whose deadline is close (today, tomorrow, or already passed)
// and surface at most one toast per entity type per day. There's no
// notification infrastructure in this app (no service worker, no push) —
// this only fires while the app is actually open, matching what the
// backlog asked for ("всплывающее уведомление"), not a real push reminder.
export function DueDateReminders({ userId }: { userId: string }) {
  const { tasks, isLoaded: tasksLoaded } = useTasks()
  const { goals, isLoaded: goalsLoaded } = useGoals()
  const { t } = useLanguage()
  const navigate = useNavigate()

  useEffect(() => {
    if (!tasksLoaded || !goalsLoaded) return

    const shown = readShownToday(userId)

    const dueTasks = tasks.filter(task => !task.completed && isDueSoonOrOverdue(task.dueDate))
    if (dueTasks.length > 0 && !shown.tasks) {
      toast(t("reminders.tasksDueSoon", { count: dueTasks.length }), {
        action: { label: t("reminders.viewAction"), onClick: () => navigate("/tasks") },
      })
      markShownToday(userId, { tasks: true })
    }

    const dueGoals = goals.filter(goal => goal.progress < 100 && isDueSoonOrOverdue(goal.targetDate))
    if (dueGoals.length > 0 && !shown.goals) {
      toast(t("reminders.goalsDueSoon", { count: dueGoals.length }), {
        action: { label: t("reminders.viewAction"), onClick: () => navigate("/goals") },
      })
      markShownToday(userId, { goals: true })
    }
  }, [tasks, goals, tasksLoaded, goalsLoaded, t, navigate, userId])

  return null
}

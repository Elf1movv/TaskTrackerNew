import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { Bell, Target } from "lucide-react"
import { type Goal } from "@/entities/goal"
import { summarizeReminders, type Reminder } from "@/entities/reminder"
import { GoalProgressSummary } from "@/widgets/goal-progress-summary"
import { ReminderSummary } from "@/widgets/reminder-summary"
import { useLanguage } from "@/shared/lib/i18n"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

const FRONT = { x: 0, y: 0, scale: 1, opacity: 1 }
// Offset + scaled down + faded — the "peek" that shows a second card sits
// behind the front one, per direct feedback ("задняя карточка должна быть
// чуть видна за передней").
const BACK = { x: 10, y: 10, scale: 0.96, opacity: 0.55 }

// Swaps the Today page's "Goal progress" card for a "Reminders" card and
// back, via a round toggle button pinned to the card's own top-right
// corner (same visual language as the settings gear button, but scoped to
// this card, not fixed to the viewport). Both cards stay mounted at all
// times, stacked in one CSS Grid cell — the swap animates their
// transform/opacity/z-index rather than mounting/unmounting, which is what
// produces the "physically swapping places" feel instead of a crossfade.
export function GoalReminderSwapCard({
  goals,
  reminders,
  remindersLoaded,
}: {
  goals: Goal[]
  reminders: Reminder[]
  remindersLoaded: boolean
}) {
  const [showReminders, setShowReminders] = useState(false)
  // A plain lazy useState initializer can't do this correctly — reminders
  // load asynchronously, so on the very first render `reminders` is still
  // `[]` regardless of what's actually on the server (found by qa-tester:
  // the card never auto-opened on Reminders even with real data waiting).
  // This effect instead waits for `remindersLoaded` to actually flip true,
  // decides once, and never re-decides afterward (the ref guard) — so the
  // card still won't yank itself around later if the list changes while
  // the user is looking at goals.
  const hasSetInitial = useRef(false)
  useEffect(() => {
    if (hasSetInitial.current || !remindersLoaded) return
    hasSetInitial.current = true
    setShowReminders(summarizeReminders(reminders).total > 0)
  }, [remindersLoaded, reminders])
  const { t } = useLanguage()
  const { total, critical } = summarizeReminders(reminders)

  return (
    <div className="relative">
      {/* The global bell (widgets/reminder-bell) is hidden on /today (see
          RootLayout.tsx) so this is now the only bell on this page — the
          badge/tooltip lives here instead of being duplicated on both. */}
      <Tooltip delayDuration={1500}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setShowReminders(v => !v)}
            aria-label={showReminders ? t("today.showGoals") : t("today.showReminders")}
            className="absolute -top-3 -right-3 z-20 flex size-9 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            {showReminders ? <Target size={16} /> : <Bell size={16} />}
            {total > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-medium leading-none">
                {total}
              </span>
            )}
          </button>
        </TooltipTrigger>
        {total > 0 && <TooltipContent>{t("reminders.badgeTooltip", { total, critical })}</TooltipContent>}
      </Tooltip>

      <div className="grid">
        <motion.div
          className={`col-start-1 row-start-1 ${showReminders ? "pointer-events-none" : ""}`}
          style={{ zIndex: showReminders ? 0 : 10 }}
          animate={showReminders ? BACK : FRONT}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <GoalProgressSummary goals={goals} />
        </motion.div>
        <motion.div
          className={`col-start-1 row-start-1 ${showReminders ? "" : "pointer-events-none"}`}
          style={{ zIndex: showReminders ? 10 : 0 }}
          animate={showReminders ? FRONT : BACK}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <ReminderSummary reminders={reminders} />
        </motion.div>
      </div>
    </div>
  )
}

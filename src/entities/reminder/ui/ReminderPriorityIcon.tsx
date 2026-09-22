import { forwardRef } from "react"
import { ChevronsUp, Equal } from "lucide-react"
import { REMINDER_PRIORITY_COLORS, type ReminderPriority } from "../model/reminder"

// Same Jira-style icon language as Task's PriorityDot (entities/task/ui/
// PriorityDot.tsx) — "equals" for normal, stacked chevrons up for
// critical, in the same red critical already shares with Task's "high".
// Unlike the plain colored dot this replaces, shown for BOTH levels, not
// just critical — reads as one consistent system instead of "there's
// only ever an alarm, never a neutral state".
const PRIORITY_ICONS: Record<ReminderPriority, typeof ChevronsUp> = {
  normal: Equal,
  critical: ChevronsUp,
}

export const ReminderPriorityIcon = forwardRef<
  SVGSVGElement,
  { priority: ReminderPriority; size?: number; colorOverride?: string }
>(function ReminderPriorityIcon({ priority, size = 14, colorOverride }, ref) {
  const Icon = PRIORITY_ICONS[priority]
  return (
    <Icon
      ref={ref}
      size={size}
      color={colorOverride ?? REMINDER_PRIORITY_COLORS[priority]}
      strokeWidth={2.5}
      className="shrink-0"
    />
  )
})

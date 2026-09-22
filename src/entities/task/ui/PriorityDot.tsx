import { forwardRef } from "react"
import { ChevronDown, ChevronsUp, Equal } from "lucide-react"
import { PRIORITY_COLORS, type Priority } from "../model/task"

// Jira-style: stacked chevrons up for high, "equals" for medium, a single
// chevron down for low — same color meaning as before (PRIORITY_COLORS),
// just an icon instead of a plain colored dot, per direct feedback that
// the dot alone wasn't legible/informative enough.
const PRIORITY_ICONS: Record<Priority, typeof ChevronsUp> = {
  low: ChevronDown,
  medium: Equal,
  high: ChevronsUp,
}

export const PriorityDot = forwardRef<
  SVGSVGElement,
  { priority: Priority; size?: number; colorOverride?: string }
>(function PriorityDot({ priority, size = 14, colorOverride }, ref) {
  const Icon = PRIORITY_ICONS[priority]
  return (
    <Icon
      ref={ref}
      size={size}
      color={colorOverride ?? PRIORITY_COLORS[priority]}
      strokeWidth={2.5}
      className="shrink-0"
    />
  )
})

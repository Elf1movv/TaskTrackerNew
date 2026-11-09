import { Target } from "lucide-react"
import { useNavigate } from "react-router"
import { type Goal } from "@/entities/goal"

// A goal's deadline on this day — read-only, like a task deadline (audit П7,
// decision 1, 2026-11-09): goals are created and edited on the Goals page
// only. The row shows the title and progress and opens that goal there.
export function DayGoalRow({ goal }: { goal: Goal }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate(`/goals?goal=${goal.id}`)}
      className="w-full flex items-start gap-2.5 text-left group"
    >
      <Target size={13} strokeWidth={2} className="shrink-0 mt-1" style={{ color: goal.color }} />
      <span className="text-sm font-semibold flex-1 leading-snug group-hover:underline">{goal.title}</span>
      <span className="tabular-nums text-xs font-bold text-muted-foreground shrink-0">{goal.progress}%</span>
    </button>
  )
}

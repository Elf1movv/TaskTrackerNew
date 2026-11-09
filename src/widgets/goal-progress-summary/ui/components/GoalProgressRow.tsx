import { useNavigate } from "react-router"
import { GoalProgressBar, useGoals, type Goal } from "@/entities/goal"
import { useDragReorder } from "@/shared/lib/dnd"

export function GoalProgressRow({ goal }: { goal: Goal }) {
  const { reorderGoals } = useGoals()
  const navigate = useNavigate()
  const { ref, isDragging } = useDragReorder<HTMLDivElement>({
    type: "today-goal",
    id: goal.id,
    onHoverMove: reorderGoals,
  })

  return (
    <div
      ref={ref}
      onClick={() => navigate(`/goals?goal=${goal.id}`)}
      className="cursor-grab active:cursor-grabbing select-none"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <div className="flex justify-between items-start gap-3 mb-2">
        <span className="text-sm font-semibold leading-snug flex-1 line-clamp-2">{goal.title}</span>
        <span className="tabular-nums text-sm font-semibold shrink-0" style={{ color: goal.color }}>
          {goal.progress}%
        </span>
      </div>
      <GoalProgressBar percent={goal.progress} color={goal.color} />
    </div>
  )
}

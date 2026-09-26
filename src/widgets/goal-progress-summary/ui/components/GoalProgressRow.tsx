import styled from "@emotion/styled"
import { useNavigate } from "react-router"
import { GoalProgressBar, useGoals, type Goal } from "@/entities/goal"
import { useDragReorder } from "@/shared/lib/dnd"
import { monoFont } from "@/shared/lib/typography"

const PercentLabel = styled.span<{ color: string }>`
  color: ${p => p.color};
`

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
        <PercentLabel css={monoFont} color={goal.color} className="text-sm font-extrabold shrink-0">
          {goal.progress}%
        </PercentLabel>
      </div>
      <GoalProgressBar percent={goal.progress} color={goal.color} />
    </div>
  )
}

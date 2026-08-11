import { Check } from "lucide-react"
import styled from "@emotion/styled"
import { useGoals, type Milestone } from "@/entities/goal"
import { monoFont } from "@/shared/lib/typography"

const Circle = styled.div<{ completed: boolean; color: string }>`
  border-radius: 9999px;
  border-width: 2px;
  border-style: solid;
  transition: all 0.15s;
  border-color: ${p => (p.completed ? p.color : "var(--border)")};
  background-color: ${p => (p.completed ? p.color : "transparent")};
`

export function MilestoneRow({
  goalId,
  milestone,
  color,
  index,
}: {
  goalId: string
  milestone: Milestone
  color: string
  index: number
}) {
  const { toggleMilestone } = useGoals()

  return (
    <button
      onClick={() => toggleMilestone(goalId, milestone.id)}
      className="w-full flex items-center gap-3 group text-left"
    >
      <Circle
        completed={milestone.completed}
        color={color}
        className="shrink-0 w-5 h-5 flex items-center justify-center"
      >
        {milestone.completed && <Check size={9} strokeWidth={3} className="text-white" />}
      </Circle>
      <span
        className={`text-sm flex-1 leading-snug ${milestone.completed ? "line-through text-muted-foreground" : ""}`}
      >
        {milestone.title}
      </span>
      <span css={monoFont} className="text-xs text-muted-foreground">
        #{index + 1}
      </span>
    </button>
  )
}

import styled from "@emotion/styled"
import { GoalProgressBar, type Goal } from "@/entities/goal"
import { monoFont } from "@/shared/lib/typography"

const PercentLabel = styled.span<{ color: string }>`
  color: ${p => p.color};
`

export function GoalProgressSummary({ goals }: { goals: Goal[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div css={monoFont} className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-5">
        Goal Progress
      </div>
      <div className="space-y-5">
        {goals.map(goal => (
          <div key={goal.id}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs leading-snug flex-1 pr-2 line-clamp-2">{goal.title}</span>
              <PercentLabel css={monoFont} color={goal.color} className="text-xs shrink-0">
                {goal.progress}%
              </PercentLabel>
            </div>
            <GoalProgressBar percent={goal.progress} color={goal.color} />
          </div>
        ))}
      </div>
    </div>
  )
}

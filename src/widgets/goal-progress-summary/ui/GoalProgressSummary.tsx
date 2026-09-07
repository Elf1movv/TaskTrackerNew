import { type Goal } from "@/entities/goal"
import { monoFont } from "@/shared/lib/typography"
import { GoalProgressRow } from "./components"

export function GoalProgressSummary({ goals }: { goals: Goal[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div css={monoFont} className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-5">
        Goal Progress
      </div>
      {goals.length > 0 ? (
        <div className="space-y-5">
          {goals.map(goal => (
            <GoalProgressRow key={goal.id} goal={goal} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-4 text-center">No goals yet</p>
      )}
    </div>
  )
}

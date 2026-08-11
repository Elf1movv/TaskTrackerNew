import { GoalList } from "@/widgets/goal-list"
import { displayFont } from "@/shared/lib/typography"
import { GoalsProvider, useGoalsContext } from "../connectors"

function GoalsPageContent() {
  const { goals } = useGoalsContext()

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 css={displayFont} className="text-3xl mb-1">
          Goals
        </h1>
        <p className="text-sm text-muted-foreground">Long-term objectives and milestones</p>
      </div>

      {goals.length > 0 ? (
        <GoalList goals={goals} />
      ) : (
        <div className="text-center py-16 text-muted-foreground text-sm">No goals yet</div>
      )}
    </div>
  )
}

export function GoalsPage() {
  return (
    <GoalsProvider>
      <GoalsPageContent />
    </GoalsProvider>
  )
}

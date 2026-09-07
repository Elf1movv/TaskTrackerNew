import { Trash2 } from "lucide-react"
import { useGoals } from "@/entities/goal"

export function DeleteGoalButton({ goalId }: { goalId: string }) {
  const { deleteGoal } = useGoals()

  return (
    <button
      onClick={e => {
        e.stopPropagation()
        deleteGoal(goalId)
      }}
      className="p-1 rounded text-muted-foreground hover:text-destructive transition-all"
      aria-label="Delete goal"
    >
      <Trash2 size={14} />
    </button>
  )
}

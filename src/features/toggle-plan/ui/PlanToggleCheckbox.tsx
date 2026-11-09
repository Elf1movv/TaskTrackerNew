import { Check } from "lucide-react"
import { usePlans } from "@/entities/calendar-plan"

export function PlanToggleCheckbox({
  taskId,
  completed,
  size = 20,
}: {
  taskId: string
  completed: boolean
  size?: number
}) {
  const { togglePlan } = usePlans()

  return (
    <button
      onClick={() => togglePlan(taskId)}
      className="shrink-0"
      aria-label={completed ? "Mark task as not done" : "Mark task as done"}
      aria-pressed={completed}
    >
      <div
        className={`flex items-center justify-center rounded-full border-2 transition-all duration-150 ease-[ease] ${
          completed
            ? "border-primary bg-primary"
            : "border-border bg-transparent group-hover:border-primary/40"
        }`}
        style={{ width: size, height: size }}
      >
        {completed && (
          <Check size={Math.round(size / 2)} strokeWidth={3} className="text-primary-foreground" />
        )}
      </div>
    </button>
  )
}

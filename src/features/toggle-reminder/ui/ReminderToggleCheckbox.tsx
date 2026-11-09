import { Check } from "lucide-react"
import { useReminders } from "@/entities/reminder"

export function ReminderToggleCheckbox({
  reminderId,
  completed,
  size = 20,
}: {
  reminderId: string
  completed: boolean
  size?: number
}) {
  const { toggleReminder } = useReminders()

  return (
    <button
      onClick={() => toggleReminder(reminderId)}
      className="shrink-0"
      aria-label={completed ? "Mark reminder as not done" : "Mark reminder as done"}
      aria-pressed={completed}
    >
      <div
        className={`flex items-center justify-center rounded-full border-2 transition-all duration-150 ease-[ease] ${
          completed ? "border-primary bg-primary" : "border-border bg-transparent"
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

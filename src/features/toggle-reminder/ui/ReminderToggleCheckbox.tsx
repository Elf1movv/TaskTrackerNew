import { Check } from "lucide-react"
import styled from "@emotion/styled"
import { useReminders } from "@/entities/reminder"

const Circle = styled.div<{ size: number; checked: boolean }>`
  width: ${p => p.size}px;
  height: ${p => p.size}px;
  border-radius: 9999px;
  border-width: 2px;
  border-style: solid;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  border-color: ${p => (p.checked ? "var(--primary)" : "var(--border)")};
  background-color: ${p => (p.checked ? "var(--primary)" : "transparent")};
`

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
      <Circle size={size} checked={completed} className="group-hover:border-primary/40">
        {completed && (
          <Check size={Math.round(size / 2)} strokeWidth={3} className="text-primary-foreground" />
        )}
      </Circle>
    </button>
  )
}

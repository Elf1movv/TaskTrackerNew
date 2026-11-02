import { Trash2 } from "lucide-react"
import { useTasks } from "@/entities/task"

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const { deleteTask } = useTasks()

  return (
    <button
      onClick={() => deleteTask(taskId)}
      className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
      aria-label="Delete task"
    >
      <Trash2 size={13} />
    </button>
  )
}

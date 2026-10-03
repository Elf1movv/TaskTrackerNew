import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useTasks } from "@/entities/task"
import { useLanguage } from "@/shared/lib/i18n"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const { deleteTask } = useTasks()
  const { t } = useLanguage()
  const [count, setCount] = useState<number | null>(null)
  async function preview() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}/deletion-preview`, {
        headers: { "X-Time-Zone": Intl.DateTimeFormat().resolvedOptions().timeZone },
      })
      if (!response.ok) throw new Error("Preview failed")
      const data = (await response.json()) as { futurePlans: number }
      setCount(data.futurePlans)
    } catch {
      toast.error(t("transition.error"))
    }
  }
  return (
    <>
      <button
        onClick={() => void preview()}
        className="p-1 rounded text-muted-foreground hover:text-destructive"
        aria-label={t("delete.taskTitle")}
      >
        <Trash2 size={13} />
      </button>
      <AlertDialog open={count !== null} onOpenChange={open => !open && setCount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.taskTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("delete.taskBody", { count: count ?? 0 })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteTask(taskId)
                setCount(null)
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { type Task } from "@/entities/task"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
interface LegacyData {
  tasks: Task[]
}
export function LegacyTransition() {
  const { t } = useLanguage()
  const [data, setData] = useState<LegacyData>({ tasks: [] })
  const [open, setOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(10)
  const refresh = useCallback(async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/transition`)
    if (!response.ok) throw new Error("Transition loading failed")
    setData((await response.json()) as LegacyData)
  }, [])
  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.VITE_API_URL}/transition`)
      .then(async response => {
        if (!response.ok) throw new Error("Transition loading failed")
        const loaded = (await response.json()) as LegacyData
        if (!cancelled) setData(loaded)
      })
      .catch(() => {
        if (!cancelled) toast.error(t("transition.error"))
      })
    return () => {
      cancelled = true
    }
  }, [t])
  async function submit(path: string, body: object) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/transition/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      toast.error(t("transition.error"))
      await refresh()
      return
    }
    await refresh()
    window.dispatchEvent(
      new CustomEvent("collection-invalidated", { detail: ["task", "goal", "plan", "note", "reminder"] }),
    )
  }
  const count = data.tasks.length
  if (!count) return null
  return (
    <section className="mx-4 mt-4 p-4 rounded-xl bg-card border border-primary/25">
      <Button variant="outline" size="sm" onClick={() => setOpen(value => !value)} aria-expanded={open}>
        {t("transition.title")} · {count}
      </Button>
      {open && (
        <div className="mt-3 space-y-4">
          <p className="text-sm text-muted-foreground">{t("transition.intro")}</p>
          {data.tasks.slice(0, visibleCount).map(task => (
            <LegacyTask key={task.id} task={task} submit={submit} />
          ))}
          {count > visibleCount && (
            <Button variant="outline" size="sm" onClick={() => setVisibleCount(n => n + 10)}>
              {t("notes.more")}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
function LegacyTask({ task, submit }: { task: Task; submit: (path: string, body: object) => Promise<void> }) {
  const { t } = useLanguage()
  const [choice, setChoice] = useState<"task" | "note" | "plan">("task")
  const [busy, setBusy] = useState(false)
  return (
    <article className="p-4 rounded-lg border border-border space-y-3">
      <h3 className="font-semibold [overflow-wrap:anywhere]">{task.title}</h3>
      {task.description && (
        <p className="text-sm whitespace-pre-wrap [overflow-wrap:anywhere]">{task.description}</p>
      )}
      <p className="text-xs text-muted-foreground">
        {task.completed ? t("tasks.status.done") : t("tasks.status.active")} · {task.category}
        {task.dueDate &&
          ` · ${t("transition.oldDate")}: ${task.dueDate} ${task.time ?? ""}${task.endTime ? `–${task.endTime}` : ""}`}
      </p>
      <div className="flex gap-2 flex-wrap">
        {(["task", "note", "plan"] as const).map(value => (
          <Button
            key={value}
            variant={choice === value ? "default" : "outline"}
            size="sm"
            onClick={() => setChoice(value)}
          >
            {t(`transition.${value}`)}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t(`transition.${choice}Preview`)}</p>
      <Button
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            await submit("task", { sourceId: task.id, choice, expectedUpdatedAt: task.updatedAt })
          } catch {
            toast.error(t("transition.error"))
          } finally {
            setBusy(false)
          }
        }}
      >
        {t("transition.confirm")}
      </Button>
    </article>
  )
}

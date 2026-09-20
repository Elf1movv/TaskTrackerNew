import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useLanguage, type TranslationKey } from "@/shared/lib/i18n"
import { ConflictError, type Repository } from "./repository"

const ENTITY_TRANSLATION_KEYS: Record<string, TranslationKey> = {
  task: "toast.entityTask",
  goal: "toast.entityGoal",
  habit: "toast.entityHabit",
  category: "toast.entityCategory",
}

// Loads a collection from a Repository on mount, then exposes granular
// create/update/remove/reorder actions instead of a raw setter — each one
// applies the change optimistically, fires exactly one network request, and
// rolls back (with a toast) if it fails. This is what replaced the old
// "mutate local array, resync the whole thing" pattern — see
// docs/ARCHITECTURE.md for why that pattern was replaced.
export function usePersistedCollection<T extends { id: string; updatedAt: string }>(
  repository: Repository<T>,
  entityLabel: string,
) {
  const { t } = useLanguage()
  const entity = t(ENTITY_TRANSLATION_KEYS[entityLabel] ?? "toast.entityTask")
  const [items, setItems] = useState<T[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    repository.list().then(list => {
      if (!cancelled) {
        setItems(list)
        setIsLoaded(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [repository])

  const create = useCallback(
    async (item: T) => {
      setItems(prev => [item, ...prev])
      try {
        const saved = await repository.create(item)
        setItems(prev => prev.map(i => (i.id === item.id ? saved : i)))
      } catch (err) {
        setItems(prev => prev.filter(i => i.id !== item.id))
        toast.error(t("toast.createFailed", { entity }))
        console.error(err)
      }
    },
    [repository, t, entity],
  )

  // Keyed by item id — chains same-item update() calls one after another
  // instead of letting them race. Without this, dragging a goal's
  // milestones fires several update() calls in quick succession (one per
  // hover step); each one reads `expectedUpdatedAt` from React state
  // captured before any of the earlier calls' server responses land, so
  // the second call sends an already-stale timestamp and gets a false
  // "changed elsewhere" conflict — even though nothing outside this tab
  // touched the record. Chaining off the previous call's *server-confirmed*
  // result (not locally-captured state) closes that race for every caller
  // of update(), not just milestone reordering. create/remove/reorder don't
  // need this — they either have no server-side conflict check at all, or
  // (create) always target a brand-new id that can't collide with itself.
  const pendingUpdates = useRef(new Map<string, Promise<T>>())

  const update = useCallback(
    async (id: string, patch: Partial<T>) => {
      const previous = items.find(i => i.id === id)
      if (!previous) return
      setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)))

      const priorChain = pendingUpdates.current.get(id) ?? Promise.resolve(previous)
      const thisUpdate = priorChain.then(async base => {
        try {
          const saved = await repository.update(id, patch, base.updatedAt)
          setItems(prev => prev.map(i => (i.id === id ? saved : i)))
          return saved
        } catch (err) {
          if (err instanceof ConflictError) {
            const current = err.current as T
            setItems(prev => prev.map(i => (i.id === id ? current : i)))
            toast.error(t("toast.conflict", { entity }))
            console.error(err)
            return current
          }
          setItems(prev => prev.map(i => (i.id === id ? previous : i)))
          toast.error(t("toast.updateFailed", { entity }))
          console.error(err)
          return base
        }
      })
      pendingUpdates.current.set(id, thisUpdate)
      await thisUpdate
    },
    [items, repository, t, entity],
  )

  const remove = useCallback(
    async (id: string) => {
      const previous = items
      setItems(prev => prev.filter(i => i.id !== id))
      try {
        await repository.remove(id)
      } catch (err) {
        setItems(previous)
        toast.error(t("toast.deleteFailed", { entity }))
        console.error(err)
      }
    },
    [items, repository, t, entity],
  )

  const reorder = useCallback(
    async (nextItems: T[]) => {
      const previous = items
      setItems(nextItems)
      try {
        const updated = await repository.reorder(
          nextItems.map((item, index) => ({ id: item.id, order: index })),
        )
        const freshUpdatedAt = new Map(updated.map(u => [u.id, u.updatedAt]))
        setItems(prev =>
          prev.map(i => (freshUpdatedAt.has(i.id) ? { ...i, updatedAt: freshUpdatedAt.get(i.id)! } : i)),
        )
      } catch (err) {
        setItems(previous)
        toast.error(t("toast.reorderFailed"))
        console.error(err)
      }
    },
    [items, repository, t],
  )

  return { items, isLoaded, create, update, remove, reorder }
}

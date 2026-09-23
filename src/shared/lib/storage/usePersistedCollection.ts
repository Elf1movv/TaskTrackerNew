import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useLanguage, type TranslationKey } from "@/shared/lib/i18n"
import { ConflictError, type Repository } from "./repository"

const ENTITY_TRANSLATION_KEYS: Record<string, TranslationKey> = {
  task: "toast.entityTask",
  goal: "toast.entityGoal",
  habit: "toast.entityHabit",
  habitGroup: "toast.entityHabitGroup",
  category: "toast.entityCategory",
  reminder: "toast.entityReminder",
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

  // Re-fetches the whole collection from the server — for the rare case
  // where something else (e.g. deleting a category cascades to deleting its
  // tasks server-side) changed records this collection doesn't directly
  // know about, and a full resync is simpler than threading that knowledge
  // through every caller.
  const refresh = useCallback(async () => {
    const list = await repository.list()
    setItems(list)
  }, [repository])

  const create = useCallback(
    async (item: T) => {
      setItems(prev => [...prev, item])
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
      // Returns the server-confirmed item (or, on conflict/failure, whatever
      // was actually applied locally) — a caller that needs to act on this
      // item right after (e.g. moveHabitToGroup building a reorder() list)
      // must use this return value, not a pre-update snapshot from its own
      // closure: that snapshot's updatedAt goes stale the moment this call
      // resolves, and feeding it back into another write reintroduces the
      // exact same false-conflict race this queuing was built to prevent.
      return await thisUpdate
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

  // Chains reorder() calls one after another instead of letting them race —
  // a single drag gesture can still call reorder() more than once (moving
  // across several targets), and without this each call fired its own
  // concurrent full-payload request racing all the others, which is what
  // let overlapping backend transactions deadlock (see LEARNING.md,
  // 2026-09-21). The optimistic setItems below still applies immediately
  // on every call, so dragging stays visually instant — only the actual
  // network round trips get serialized.
  const pendingReorder = useRef<Promise<void>>(Promise.resolve())

  const reorder = useCallback(
    (nextItems: T[]) => {
      const previous = items
      // Most callers pass the whole collection in its new order, but some
      // (e.g. habits reordering within one group) pass only a subset —
      // replacing `items` outright would then wholesale-discard every item
      // that subset left out, until the next refresh/reload brought it
      // back. Keeping whatever the subset excluded, appended after it,
      // makes this safe either way: a full-collection call still ends up
      // as exactly `nextItems` (nothing left over to keep), and a subset
      // call keeps the rest of the collection intact.
      const nextIds = new Set(nextItems.map(i => i.id))
      setItems([...previous.filter(i => !nextIds.has(i.id)), ...nextItems])
      const thisReorder = pendingReorder.current.then(async () => {
        try {
          const updated = await repository.reorder(
            nextItems.map((item, index) => ({ id: item.id, order: index })),
          )
          const freshUpdatedAt = new Map(updated.map(u => [u.id, u.updatedAt]))
          setItems(prev =>
            prev.map(i => (freshUpdatedAt.has(i.id) ? { ...i, updatedAt: freshUpdatedAt.get(i.id)! } : i)),
          )
          // The server bumps updatedAt on every reordered row (it's an
          // @updatedAt column) even though only `order` changed — but
          // update()'s own per-id chain (pendingUpdates below) only ever
          // chains off a *previous update()'s* result, with no way to know
          // a reorder() touched this id too. Left alone, a follow-up
          // update() on one of these ids (e.g. moving the same habit to
          // yet another group right after) would send the pre-reorder
          // updatedAt and get a real conflict from the server — not a bug
          // in that update(), just a stale base it was never told about.
          // Seeding the chain here with the reorder-confirmed item closes
          // that gap for the common case (the next update() starts after
          // this reorder has resolved); a genuinely concurrent update() for
          // the same id, mid-flight right as this resolves, is the one
          // narrow case this doesn't cover.
          nextItems.forEach(item => {
            const updatedAt = freshUpdatedAt.get(item.id)
            if (updatedAt) pendingUpdates.current.set(item.id, Promise.resolve({ ...item, updatedAt }))
          })
        } catch (err) {
          setItems(previous)
          toast.error(t("toast.reorderFailed"))
          console.error(err)
        }
      })
      pendingReorder.current = thisReorder
      return thisReorder
    },
    [items, repository, t],
  )

  return { items, isLoaded, create, update, remove, reorder, refresh }
}

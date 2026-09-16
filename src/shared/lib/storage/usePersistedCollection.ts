import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { ConflictError, type Repository } from "./repository"

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
        toast.error(`Couldn't save the new ${entityLabel}. Please try again.`)
        console.error(err)
      }
    },
    [repository, entityLabel],
  )

  const update = useCallback(
    async (id: string, patch: Partial<T>) => {
      const previous = items.find(i => i.id === id)
      if (!previous) return
      setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)))
      try {
        const saved = await repository.update(id, patch, previous.updatedAt)
        setItems(prev => prev.map(i => (i.id === id ? saved : i)))
      } catch (err) {
        if (err instanceof ConflictError) {
          setItems(prev => prev.map(i => (i.id === id ? (err.current as T) : i)))
          toast.error(`This ${entityLabel} was changed elsewhere — showing the latest version.`)
        } else {
          setItems(prev => prev.map(i => (i.id === id ? previous : i)))
          toast.error(`Couldn't save changes to this ${entityLabel}. Please try again.`)
        }
        console.error(err)
      }
    },
    [items, repository, entityLabel],
  )

  const remove = useCallback(
    async (id: string) => {
      const previous = items
      setItems(prev => prev.filter(i => i.id !== id))
      try {
        await repository.remove(id)
      } catch (err) {
        setItems(previous)
        toast.error(`Couldn't delete this ${entityLabel}. Please try again.`)
        console.error(err)
      }
    },
    [items, repository, entityLabel],
  )

  const reorder = useCallback(
    async (nextItems: T[]) => {
      const previous = items
      setItems(nextItems)
      try {
        await repository.reorder(nextItems.map((item, index) => ({ id: item.id, order: index })))
      } catch (err) {
        setItems(previous)
        toast.error("Couldn't save the new order. Please try again.")
        console.error(err)
      }
    },
    [items, repository],
  )

  return { items, isLoaded, create, update, remove, reorder }
}

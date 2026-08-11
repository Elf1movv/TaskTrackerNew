import { useEffect, useState } from "react"
import type { Repository } from "./repository"

// Loads a collection from a Repository on mount and persists it back on every
// change. Shared by every entity store so the load/save wiring lives in one
// place regardless of which Repository implementation is plugged in.
export function usePersistedCollection<T>(repository: Repository<T>) {
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

  useEffect(() => {
    if (isLoaded) repository.save(items)
  }, [items, isLoaded, repository])

  return [items, setItems] as const
}

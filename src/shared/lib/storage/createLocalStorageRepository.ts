import type { Repository } from "./repository"

// localStorage-backed implementation of Repository<T>. Swap this factory for
// a createRestRepository(baseUrl)/socket-sync implementation later without
// touching any entity model code — they only depend on the Repository interface.
export function createLocalStorageRepository<T>(key: string, seed: T[]): Repository<T> {
  return {
    async list() {
      const raw = localStorage.getItem(key)
      if (!raw) return seed
      try {
        return JSON.parse(raw) as T[]
      } catch {
        return seed
      }
    },
    async save(items) {
      localStorage.setItem(key, JSON.stringify(items))
    },
  }
}

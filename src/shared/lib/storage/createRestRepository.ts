import type { Repository } from "./repository"

// REST-backed implementation of Repository<T> — talks to the Node/Express
// backend instead of localStorage (see createLocalStorageRepository, which
// this is a drop-in replacement for). `save` replaces the whole collection
// server-side in one request, matching the `list`/`save` contract exactly —
// no other entity code needs to change to switch from local storage to a
// real database.
export function createRestRepository<T>(baseUrl: string): Repository<T> {
  return {
    async list() {
      const res = await fetch(baseUrl)
      if (!res.ok) throw new Error(`Failed to load ${baseUrl}: ${res.status}`)
      return res.json() as Promise<T[]>
    },
    async save(items) {
      const res = await fetch(baseUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      })
      if (!res.ok) throw new Error(`Failed to save ${baseUrl}: ${res.status}`)
    },
  }
}

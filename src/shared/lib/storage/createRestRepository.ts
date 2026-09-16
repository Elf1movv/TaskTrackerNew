import { ConflictError, type Repository } from "./repository"

// REST-backed implementation of Repository<T> — talks to the Node/Express
// backend, one granular request per action (create/update/remove/reorder)
// instead of resaving the whole collection. See docs/ARCHITECTURE.md for
// why this replaced the earlier whole-collection GET/PUT design.
export function createRestRepository<T extends { id: string; updatedAt: string }>(
  baseUrl: string,
): Repository<T> {
  return {
    async list() {
      const res = await fetch(baseUrl)
      if (!res.ok) throw new Error(`Failed to load ${baseUrl}: ${res.status}`)
      return res.json() as Promise<T[]>
    },
    async create(item) {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })
      if (!res.ok) throw new Error(`Failed to create item at ${baseUrl}: ${res.status}`)
      return res.json() as Promise<T>
    },
    async update(id, patch, expectedUpdatedAt) {
      const res = await fetch(`${baseUrl}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch, expectedUpdatedAt }),
      })
      if (res.status === 409) {
        const body = (await res.json()) as { current: T }
        throw new ConflictError(body.current)
      }
      if (!res.ok) throw new Error(`Failed to update ${baseUrl}/${id}: ${res.status}`)
      return res.json() as Promise<T>
    },
    async remove(id) {
      const res = await fetch(`${baseUrl}/${id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 404) {
        throw new Error(`Failed to delete ${baseUrl}/${id}: ${res.status}`)
      }
    },
    async reorder(order) {
      const res = await fetch(`${baseUrl}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      })
      if (!res.ok) throw new Error(`Failed to reorder ${baseUrl}: ${res.status}`)
    },
  }
}

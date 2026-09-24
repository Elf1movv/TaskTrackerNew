import { createRestRepository, type Repository } from "@/shared/lib/storage"
import type { Habit } from "../model/habit"

const baseUrl = `${import.meta.env.VITE_API_URL}/habits`

// A second reorder endpoint outside the generic Repository<Habit> contract
// — writes `todayOrder` (the Today page's independent ordering axis)
// instead of `order`. Passed as usePersistedCollection.reorder()'s optional
// second argument wherever Today-side reordering happens; every other
// caller keeps using the plain `reorder` below and never sees this.
export const habitRepository: Repository<Habit> & {
  reorderToday: (order: { id: string; order: number }[]) => Promise<{ id: string; updatedAt: string }[]>
} = {
  ...createRestRepository<Habit>(baseUrl),
  async reorderToday(order) {
    const res = await fetch(`${baseUrl}/reorder-today`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    })
    if (!res.ok) throw new Error(`Failed to reorder ${baseUrl} (today): ${res.status}`)
    return res.json() as Promise<{ id: string; updatedAt: string }[]>
  },
}

// The phone keeps the last server-confirmed copy of each collection (tasks,
// habits…) so the next start shows it at once and checks the server in the
// background — "show at once, check at once" (owner decision 2026-11-15, built
// 2026-11-18). localStorage, not IndexedDB: it is read synchronously, so the
// very first render already has data. A few dozen KB per person.
//
// Rules:
// - one person's data only: setCacheUser() wipes any other account's copy;
// - logging out wipes everything (clearAllCaches);
// - FORMAT goes up by hand when the shape of stored records changes — an old
//   copy is then ignored and removed instead of breaking a screen;
// - every access may fail (private mode, blocked or full storage) — then the
//   app simply works without the copy.

const PREFIX = "mytracker-cache:"
const FORMAT = "v1"
const MAX_CHARS = 1_500_000 // ~1.5 MB per collection: skip rather than fill the storage

let userId: string | null = null

function key(entity: string): string | null {
  return userId ? `${PREFIX}${FORMAT}:${userId}:${entity}` : null
}

function ownKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(PREFIX)) keys.push(k)
  }
  return keys
}

// Called once the login is confirmed, before any collection renders.
export function setCacheUser(id: string): void {
  if (userId === id) return
  userId = id
  try {
    const mine = `${PREFIX}${FORMAT}:${id}:`
    for (const k of ownKeys()) if (!k.startsWith(mine)) localStorage.removeItem(k)
  } catch {
    // storage unavailable — nothing to clean
  }
}

export function clearAllCaches(): void {
  userId = null
  try {
    for (const k of ownKeys()) localStorage.removeItem(k)
  } catch {
    // storage unavailable — nothing was stored
  }
}

export function readCache<T>(entity: string): T[] | null {
  const k = key(entity)
  if (!k) return null
  try {
    const raw = localStorage.getItem(k)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : null
  } catch {
    return null
  }
}

export function writeCache<T>(entity: string, items: T[]): void {
  const k = key(entity)
  if (!k) return
  try {
    const raw = JSON.stringify(items)
    if (raw.length > MAX_CHARS) localStorage.removeItem(k)
    else localStorage.setItem(k, raw)
  } catch {
    // full or blocked storage — keep working without the copy
  }
}

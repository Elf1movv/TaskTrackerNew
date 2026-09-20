import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { LanguageProvider } from "@/shared/lib/i18n"
import { usePersistedCollection } from "./usePersistedCollection"
import type { Repository } from "./repository"

interface Item {
  id: string
  updatedAt: string
  value: string
}

// A fake repository whose update() resolves after a controllable delay and
// always returns a fresh `updatedAt` — mirroring the real REST repository,
// where the server bumps `updatedAt` on every successful write.
function createFakeRepository(item: Item, delayMs: number): Repository<Item> {
  let stored = { ...item }
  let tick = 0
  return {
    list: async () => [stored],
    create: async i => i,
    update: async (_id, patch, expectedUpdatedAt) => {
      await new Promise(resolve => setTimeout(resolve, delayMs))
      if (stored.updatedAt !== expectedUpdatedAt) {
        const { ConflictError } = await import("./repository")
        throw new ConflictError(stored)
      }
      tick += 1
      stored = { ...stored, ...patch, updatedAt: `t${tick}` }
      return stored
    },
    remove: async () => {},
    reorder: async order => order.map(o => ({ id: o.id, updatedAt: stored.updatedAt })),
  }
}

describe("usePersistedCollection: same-item update() race", () => {
  it("chains two rapid update() calls on the same item instead of racing on a stale expectedUpdatedAt", async () => {
    const repo = createFakeRepository({ id: "1", updatedAt: "t0", value: "a" }, 20)
    const { result } = renderHook(() => usePersistedCollection<Item>(repo, "task"), {
      wrapper: ({ children }) => <LanguageProvider>{children}</LanguageProvider>,
    })

    await waitFor(() => expect(result.current.isLoaded).toBe(true))

    // Fire two updates back-to-back, before either's network round trip
    // resolves — this is exactly what dragging a goal's milestones across
    // several positions does (one update() per hover step).
    let firstCall: Promise<void>
    let secondCall: Promise<void>
    act(() => {
      firstCall = result.current.update("1", { value: "b" })
      secondCall = result.current.update("1", { value: "c" })
    })
    await act(async () => {
      await Promise.all([firstCall, secondCall])
    })

    // Neither call should have hit the false-conflict path.
    const updated = result.current.items.find(i => i.id === "1")
    expect(updated?.value).toBe("c")
  })
})

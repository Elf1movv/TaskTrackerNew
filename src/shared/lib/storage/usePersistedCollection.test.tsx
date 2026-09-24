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

// A fake repository seeded with several items — for exercising reorder()
// with a subset of the collection, the way reordering habits within one
// group (rather than the whole habit list) does.
function createMultiItemRepository(items: Item[]): Repository<Item> {
  return {
    list: async () => items,
    create: async i => i,
    update: async (_id, patch) => ({ ...items[0], ...patch }),
    remove: async () => {},
    reorder: async order => order.map(o => ({ id: o.id, updatedAt: "t1" })),
  }
}

// A fake repository where BOTH update() and reorder() bump updatedAt (like
// Prisma's @updatedAt does server-side on every write, reorder() included)
// and update() enforces expectedUpdatedAt — for exercising the sequence a
// cross-group habit move actually does: update() the moved item, then
// reorder() the item alongside its new group.
function createConflictAwareRepository(item: Item): Repository<Item> {
  let stored = { ...item }
  let tick = 0
  return {
    list: async () => [stored],
    create: async i => i,
    update: async (_id, patch, expectedUpdatedAt) => {
      if (stored.updatedAt !== expectedUpdatedAt) {
        const { ConflictError } = await import("./repository")
        throw new ConflictError(stored)
      }
      tick += 1
      stored = { ...stored, ...patch, updatedAt: `t${tick}` }
      return stored
    },
    remove: async () => {},
    reorder: async order => {
      tick += 1
      if (order.some(o => o.id === stored.id)) stored = { ...stored, updatedAt: `t${tick}` }
      return order.map(o => ({ id: o.id, updatedAt: stored.id === o.id ? stored.updatedAt : `t${tick}` }))
    },
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
    let firstCall: ReturnType<typeof result.current.update>
    let secondCall: ReturnType<typeof result.current.update>
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

describe("usePersistedCollection: reorder() with a subset", () => {
  it("keeps items the reordered subset left out, instead of discarding them from local state", async () => {
    const items: Item[] = [
      { id: "1", updatedAt: "t0", value: "in group A" },
      { id: "2", updatedAt: "t0", value: "in group B" },
      { id: "3", updatedAt: "t0", value: "in group B" },
    ]
    const repo = createMultiItemRepository(items)
    const { result } = renderHook(() => usePersistedCollection<Item>(repo, "task"), {
      wrapper: ({ children }) => <LanguageProvider>{children}</LanguageProvider>,
    })

    await waitFor(() => expect(result.current.isLoaded).toBe(true))

    // Reorder only group B's two items (item "1" from group A isn't part
    // of this call) — mirrors reorderHabitsInGroup/moveHabitToGroup, which
    // pass one group's habits, not the whole collection.
    await act(async () => {
      await result.current.reorder([items[2], items[1]])
    })

    expect(result.current.items.map(i => i.id).sort()).toEqual(["1", "2", "3"])
  })
})

describe("usePersistedCollection: update() then reorder() on the same item", () => {
  it("lets a second update() on the same item succeed after an update()+reorder() sequence", async () => {
    // Mirrors moveHabitToGroup: update() a field, then reorder() a list
    // that includes that same item — using update()'s own return value
    // (the server-confirmed item) rather than a pre-update snapshot, so
    // reorder()'s optimistic state doesn't clobber the fresh updatedAt
    // update() just applied.
    const repo = createConflictAwareRepository({ id: "1", updatedAt: "t0", value: "a" })
    const { result } = renderHook(() => usePersistedCollection<Item>(repo, "task"), {
      wrapper: ({ children }) => <LanguageProvider>{children}</LanguageProvider>,
    })

    await waitFor(() => expect(result.current.isLoaded).toBe(true))

    let moved: Item | undefined
    await act(async () => {
      moved = await result.current.update("1", { value: "moved" })
    })
    expect(moved).toBeDefined()

    await act(async () => {
      await result.current.reorder([moved as Item])
    })

    // A follow-up update on the same item — the second move in a row —
    // must not hit the false-conflict path.
    await act(async () => {
      await result.current.update("1", { value: "moved again" })
    })

    const updated = result.current.items.find(i => i.id === "1")
    expect(updated?.value).toBe("moved again")
  })
})

describe("usePersistedCollection: reorder() with a second, independent axis", () => {
  it("sends the reorder to the passed-in request function, not the repository's own reorder, and still seeds pendingUpdates from its response", async () => {
    // Mirrors habitRepository.reorderToday — a completely separate network
    // call/column (e.g. todayOrder) from the repository's default reorder
    // (e.g. order), sharing the same server-side updatedAt bump behavior.
    let defaultReorderCalls = 0
    let secondaryTick = 100
    let secondaryUpdatedAt = "t0"
    const repo: Repository<Item> = {
      list: async () => [{ id: "1", updatedAt: "t0", value: "a" }],
      create: async i => i,
      update: async (_id, patch, expectedUpdatedAt) => {
        if (expectedUpdatedAt !== secondaryUpdatedAt) {
          const { ConflictError } = await import("./repository")
          throw new ConflictError({ id: "1", updatedAt: secondaryUpdatedAt, value: "a" })
        }
        secondaryTick += 1
        secondaryUpdatedAt = `t${secondaryTick}`
        return { id: "1", updatedAt: secondaryUpdatedAt, value: patch.value ?? "a" }
      },
      remove: async () => {},
      reorder: async order => {
        defaultReorderCalls += 1
        return order.map(o => ({ id: o.id, updatedAt: "should-not-be-used" }))
      },
    }
    const secondaryReorder = async (order: { id: string; order: number }[]) => {
      secondaryTick += 1
      secondaryUpdatedAt = `t${secondaryTick}`
      return order.map(o => ({ id: o.id, updatedAt: secondaryUpdatedAt }))
    }

    const { result } = renderHook(() => usePersistedCollection<Item>(repo, "task"), {
      wrapper: ({ children }) => <LanguageProvider>{children}</LanguageProvider>,
    })
    await waitFor(() => expect(result.current.isLoaded).toBe(true))

    await act(async () => {
      await result.current.reorder([{ id: "1", updatedAt: "t0", value: "a" }], secondaryReorder)
    })
    expect(defaultReorderCalls).toBe(0)

    // A follow-up update() must use the secondary reorder's confirmed
    // updatedAt, not the pre-reorder one — same pendingUpdates-seeding
    // protection the default axis already gets.
    await act(async () => {
      await result.current.update("1", { value: "b" })
    })
    expect(result.current.items.find(i => i.id === "1")?.value).toBe("b")
  })
})

import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { LanguageProvider } from "@/shared/lib/i18n"
import {
  clearAllCaches,
  readCache,
  readLastUser,
  saveLastUser,
  setCacheUser,
  writeCache,
} from "./collectionCache"
import type { Repository } from "./repository"
import { usePersistedCollection } from "./usePersistedCollection"

interface Item {
  id: string
  updatedAt: string
  value: string
}

const wrapper = ({ children }: { children: ReactNode }) => <LanguageProvider>{children}</LanguageProvider>

function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>(r => (resolve = r))
  return { promise, resolve }
}

beforeEach(() => {
  localStorage.clear()
  clearAllCaches()
  setCacheUser("u1")
})
afterEach(() => localStorage.clear())

describe("collectionCache", () => {
  it("keeps one person's copy and wipes another's", () => {
    writeCache("task", [{ id: "a" }])
    expect(readCache("task")).toEqual([{ id: "a" }])
    setCacheUser("u2")
    expect(readCache("task")).toBeNull()
    setCacheUser("u1")
    expect(readCache("task")).toBeNull() // u1's copy was wiped when u2 logged in
  })

  it("forgets everything on log out", () => {
    writeCache("task", [{ id: "a" }])
    clearAllCaches()
    setCacheUser("u1")
    expect(readCache("task")).toBeNull()
  })

  it("remembers the last person until log out, also when another logs in", () => {
    saveLastUser({ id: "u1", email: "a@example.com" })
    setCacheUser("u2")
    expect(readLastUser()).toEqual({ id: "u1", email: "a@example.com" })
    clearAllCaches()
    expect(readLastUser()).toBeNull()
  })

  it("ignores a copy that isn't a list", () => {
    localStorage.setItem("mytracker-cache:v1:u1:task", "{oops")
    expect(readCache("task")).toBeNull()
  })
})

describe("usePersistedCollection with the phone's copy", () => {
  it("shows the copy at once, then the server's answer", async () => {
    writeCache("task", [{ id: "a", updatedAt: "t0", value: "old" }])
    const answer = deferred<Item[]>()
    const repo = { list: () => answer.promise } as unknown as Repository<Item>
    const { result } = renderHook(() => usePersistedCollection(repo, "task"), { wrapper })

    expect(result.current.items.map(i => i.value)).toEqual(["old"])
    expect(result.current.isLoaded).toBe(true)
    expect(result.current.isSynced).toBe(false)

    await act(async () => answer.resolve([{ id: "a", updatedAt: "t1", value: "new" }]))
    expect(result.current.items.map(i => i.value)).toEqual(["new"])
    expect(result.current.isSynced).toBe(true)
    expect(readCache<Item>("task")?.[0].value).toBe("new")
  })

  it("never stores a change that is still on its way or failed", async () => {
    const failing = deferred<Item>()
    const repo: Repository<Item> = {
      list: async () => [],
      create: () => failing.promise,
      update: async () => {
        throw new Error("no")
      },
      remove: async () => {},
      reorder: async () => [],
    }
    const { result } = renderHook(() => usePersistedCollection(repo, "task"), { wrapper })
    await waitFor(() => expect(result.current.isSynced).toBe(true))

    act(() => void result.current.create({ id: "b", updatedAt: "t0", value: "draft" }))
    expect(result.current.items).toHaveLength(1)
    expect(readCache("task")).toEqual([]) // not confirmed yet

    await act(async () => failing.resolve({ id: "b", updatedAt: "t1", value: "draft" }))
    expect(readCache<Item>("task")?.map(i => i.id)).toEqual(["b"]) // confirmed now
  })

  it("doesn't let an answer asked for before an edit undo that edit", async () => {
    writeCache("task", [{ id: "a", updatedAt: "t0", value: "old" }])
    const answers = [deferred<Item[]>(), deferred<Item[]>()]
    let call = 0
    const repo: Repository<Item> = {
      list: () => answers[call++].promise,
      create: async i => i,
      update: async (_id, patch) => ({ id: "a", updatedAt: "t1", value: "old", ...patch }),
      remove: async () => {},
      reorder: async () => [],
    }
    const { result } = renderHook(() => usePersistedCollection(repo, "task"), { wrapper })

    // The person edits the cached record before the first answer arrives.
    await act(async () => void (await result.current.update("a", { value: "mine" })))
    // That first answer was asked for before the edit — it must not win.
    await act(async () => answers[0].resolve([{ id: "a", updatedAt: "t0", value: "old" }]))
    expect(result.current.items[0].value).toBe("mine")

    // It is asked again; the fresh answer already has the edit.
    await act(async () => answers[1].resolve([{ id: "a", updatedAt: "t1", value: "mine" }]))
    await waitFor(() => expect(result.current.isSynced).toBe(true))
    expect(result.current.items[0].value).toBe("mine")
    expect(readCache<Item>("task")?.[0].value).toBe("mine")
  })
})

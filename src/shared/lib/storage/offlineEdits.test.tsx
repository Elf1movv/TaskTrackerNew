import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"
import { LanguageProvider } from "@/shared/lib/i18n"
import { markStartedOffline } from "@/shared/lib/pwa"
import type { Repository } from "./repository"
import { usePersistedCollection } from "./usePersistedCollection"

interface Item {
  id: string
  updatedAt: string
  value: string
}
const wrapper = ({ children }: { children: ReactNode }) => <LanguageProvider>{children}</LanguageProvider>

// Offline view, step 1 (2026-11-18): without a network nothing changes and
// nothing is sent — there is no queue of changes yet.
describe("usePersistedCollection without a network", () => {
  it("refuses create, update, remove and reorder", async () => {
    const repo = {
      list: vi.fn(async () => [{ id: "a", updatedAt: "t0", value: "x" }]),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      reorder: vi.fn(),
    } as unknown as Repository<Item>
    const { result } = renderHook(() => usePersistedCollection(repo, "task"), { wrapper })
    await waitFor(() => expect(result.current.isSynced).toBe(true))

    markStartedOffline()
    await act(async () => {
      expect(await result.current.create({ id: "b", updatedAt: "t0", value: "y" })).toBe(false)
      await result.current.update("a", { value: "z" })
      await result.current.remove("a")
      await result.current.reorder([])
    })

    expect(result.current.items).toEqual([{ id: "a", updatedAt: "t0", value: "x" }])
    expect(repo.create).not.toHaveBeenCalled()
    expect(repo.update).not.toHaveBeenCalled()
    expect(repo.remove).not.toHaveBeenCalled()
    expect(repo.reorder).not.toHaveBeenCalled()
  })
})

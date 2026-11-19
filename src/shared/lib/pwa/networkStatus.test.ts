import { afterEach, describe, expect, it, vi } from "vitest"
import { isOfflineMode } from "./networkStatus"

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

// Phones often never fire `online` (owner, 2026-11-19): the app must notice the
// connection is back by asking the server itself.
describe("networkStatus without the browser's online event", () => {
  it("leaves offline mode once the server answers", async () => {
    vi.useFakeTimers()
    let serverUp = false
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        if (!serverUp) throw new TypeError("Failed to fetch")
        return new Response('{"ok":true}', { status: 200 })
      }),
    )

    window.dispatchEvent(new Event("offline"))
    expect(isOfflineMode()).toBe(true)

    await vi.advanceTimersByTimeAsync(5000) // still no network
    expect(isOfflineMode()).toBe(true)

    serverUp = true // network is back, but no `online` event comes
    await vi.advanceTimersByTimeAsync(5000)
    expect(isOfflineMode()).toBe(false)
  })
})

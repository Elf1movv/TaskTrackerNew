import { renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { chromeIntentUrl, usePwaInstall } from "./pwa"

const ANDROID_YANDEX =
  "Mozilla/5.0 (Linux; Android 13; CPH2381) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 YaBrowser/24.4.1.99.00 SA/3 Mobile Safari/537.36"
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
const DESKTOP_YANDEX =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 YaBrowser/24.4.0.0 Safari/537.36"

function withUserAgent(ua: string) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ua)
}

afterEach(() => vi.restoreAllMocks())

describe("usePwaInstall — Android browsers that can't install (2026-11-15)", () => {
  it("suggests Chrome in Yandex Browser on Android", () => {
    withUserAgent(ANDROID_YANDEX)
    expect(renderHook(() => usePwaInstall()).result.current.mode).toBe("chrome")
  })

  it("shows nothing in Chrome on Android until Chrome offers the install itself", () => {
    withUserAgent(ANDROID_CHROME)
    expect(renderHook(() => usePwaInstall()).result.current.mode).toBeNull()
  })

  it("does not suggest Chrome to Yandex Browser on a computer", () => {
    withUserAgent(DESKTOP_YANDEX)
    expect(renderHook(() => usePwaInstall()).result.current.mode).toBeNull()
  })

  it("links to this site's Today page in Chrome, with Google Play as the fallback", () => {
    const url = chromeIntentUrl()
    expect(
      url.startsWith(`intent://${location.host}/today#Intent;scheme=https;package=com.android.chrome;`),
    ).toBe(true)
    expect(url).toContain("S.browser_fallback_url=https%3A%2F%2Fplay.google.com")
    expect(url.endsWith(";end")).toBe(true)
  })
})

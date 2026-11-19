import { useSyncExternalStore } from "react"

// "Is the app without a network right now?" — one flag for the whole app
// (offline view, 2026-11-18):
// - the start-up login check could not reach the server, but this device has
//   a saved copy of the last person's data (RootLayout) — `startedOffline`;
// - or the browser reports the connection is gone mid-session.
// While on, changes are refused (shared/lib/storage/usePersistedCollection)
// and a strip says so (app/layouts/OfflineBanner). Coming back online after an
// offline start reloads the page: the login check then runs for real.
let startedOffline = false
let browserOffline = typeof navigator !== "undefined" && navigator.onLine === false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(l => l())

export function isOfflineMode(): boolean {
  return startedOffline || browserOffline
}

export function markStartedOffline(): void {
  if (startedOffline) return
  startedOffline = true
  startProbing()
  notify()
}

// Back online. After an offline start the page reloads (the login check then
// runs for real); after a mid-session loss the strip just goes away.
function backOnline() {
  browserOffline = false
  stopProbing()
  if (startedOffline) window.location.reload()
  else notify()
}

// Phones often never fire the browser's `online` event — an app on the iPhone
// home screen after airplane mode, a switch between Wi-Fi and mobile data —
// and the app stayed in offline mode until restarted (owner, 2026-11-19).
// So while offline we ask the server ourselves: every 5 s, whenever the app
// comes back to the screen, and on the strip's "Retry" button.
const PROBE_EVERY_MS = 5000
let probeTimer: number | undefined
let probing = false

export async function checkConnection(): Promise<boolean> {
  if (probing) return false
  probing = true
  try {
    const res = await fetch("/api/health", { cache: "no-store" })
    if (res.ok) {
      backOnline()
      return true
    }
  } catch {
    // still no network
  } finally {
    probing = false
  }
  return false
}

function startProbing() {
  if (probeTimer !== undefined || typeof window === "undefined") return
  probeTimer = window.setInterval(() => void checkConnection(), PROBE_EVERY_MS)
}

function stopProbing() {
  if (probeTimer === undefined) return
  window.clearInterval(probeTimer)
  probeTimer = undefined
}

if (typeof window !== "undefined") {
  window.addEventListener("offline", () => {
    browserOffline = true
    startProbing()
    notify()
  })
  window.addEventListener("online", backOnline)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && isOfflineMode()) void checkConnection()
  })
  if (browserOffline) startProbing()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useIsOffline(): boolean {
  return useSyncExternalStore(subscribe, isOfflineMode, () => false)
}

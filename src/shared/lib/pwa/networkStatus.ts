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
  notify()
}

if (typeof window !== "undefined") {
  window.addEventListener("offline", () => {
    browserOffline = true
    notify()
  })
  window.addEventListener("online", () => {
    browserOffline = false
    if (startedOffline) window.location.reload()
    else notify()
  })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useIsOffline(): boolean {
  return useSyncExternalStore(subscribe, isOfflineMode, () => false)
}

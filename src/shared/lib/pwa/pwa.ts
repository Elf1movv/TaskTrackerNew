import { useEffect, useSyncExternalStore } from "react"

// The installable-app (PWA) side of the site, 2026-11-12: registers the
// service worker (public/sw.js), keeps Chrome's install prompt for the
// "Install the app" button in settings, and keeps the browser/OS bar color
// in step with the app's theme.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(listener => listener())

// Called once from main.tsx before the app renders: Chrome fires
// `beforeinstallprompt` early, often before any React component exists.
export function initPwa() {
  window.addEventListener("beforeinstallprompt", event => {
    // Keep the browser's own mini-bar from popping up at a random moment —
    // the install offer lives in settings.
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null
    notify()
  })
  // Only the built site: in `npm run dev` a service worker would keep serving
  // stale pages between code changes.
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(err => console.error(err))
    })
  }
}

// Already opened as an installed app (home-screen icon, own window).
export function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

// iPhone/iPad: no install prompt there — the person adds the site through
// the Share menu, so we show instructions instead. iPadOS reports itself as
// a Mac, hence the touch check.
function isIos(): boolean {
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1)
}

export type InstallMode = "prompt" | "ios" | null

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getMode(): InstallMode {
  if (isStandalone()) return null
  if (deferredPrompt) return "prompt"
  return isIos() ? "ios" : null
}

// What the settings button should do: show Chrome's install dialog, show the
// iPhone instructions, or not be shown at all (already installed, or a
// browser that can't install sites).
export function usePwaInstall() {
  const mode = useSyncExternalStore(subscribe, getMode, () => null)
  async function promptInstall() {
    const event = deferredPrompt
    if (!event) return
    await event.prompt()
    // A prompt can be used only once; Chrome fires a new event if the person
    // said no and may be asked again later.
    deferredPrompt = null
    notify()
  }
  return { mode, promptInstall }
}

// The phone's status bar / the installed window's title bar takes this
// color — matching the page background makes it look like part of the app.
export function useThemeColorSync(theme: string | undefined) {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) return
    // Next frame: this effect runs before ThemeProvider's own effect puts the
    // theme class on <html>, so reading right away gave the other theme's
    // color.
    const frame = requestAnimationFrame(() => {
      const color = getComputedStyle(document.documentElement).getPropertyValue("--background").trim()
      meta.content = color || "#0b1117"
    })
    return () => cancelAnimationFrame(frame)
  }, [theme])
}

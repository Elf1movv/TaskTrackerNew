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

// The visible part of the screen (what's left above a phone keyboard, and
// where it is after the browser scrolled for it) as CSS variables on <html>:
// dialogs centre themselves in it (shared/ui/dialog.tsx). Without
// visualViewport the dialog falls back to the whole screen.
function trackVisibleViewport() {
  const viewport = window.visualViewport
  if (!viewport) return
  const style = document.documentElement.style
  const update = () => {
    style.setProperty("--vv-height", `${viewport.height}px`)
    style.setProperty("--vv-top", `${viewport.offsetTop}px`)
  }
  update()
  viewport.addEventListener("resize", update)
  viewport.addEventListener("scroll", update)
}

// Called once from main.tsx before the app renders: Chrome fires
// `beforeinstallprompt` early, often before any React component exists.
export function initPwa() {
  trackVisibleViewport()
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

// Android browsers that can't install a site as an app: "Add to home screen"
// there makes a bookmark with the browser's own icon that opens a new tab
// (user report 2026-11-12: Yandex Browser on an Oppo). They never send
// `beforeinstallprompt`, so instead we offer to open the site in Chrome.
// HeyTap — the stock browser on Oppo/Realme/OnePlus; Miui — on Xiaomi.
const NO_INSTALL_BROWSERS = /YaBrowser|YaApp|HeyTapBrowser|MiuiBrowser/

function isAndroidWithoutInstall(): boolean {
  const ua = navigator.userAgent
  return /Android/.test(ua) && NO_INSTALL_BROWSERS.test(ua)
}

// An Android "intent" link: opens this site in Chrome; without Chrome — its
// Google Play page.
export function chromeIntentUrl(): string {
  const fallback = encodeURIComponent("https://play.google.com/store/apps/details?id=com.android.chrome")
  return `intent://${location.host}/today#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`
}

export type InstallMode = "prompt" | "ios" | "chrome" | null

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getMode(): InstallMode {
  if (isStandalone()) return null
  if (deferredPrompt) return "prompt"
  if (isIos()) return "ios"
  return isAndroidWithoutInstall() ? "chrome" : null
}

// What the settings button should do: show Chrome's install dialog, show the
// iPhone instructions, suggest Chrome (Android browsers that can't install),
// or not be shown at all (already installed, or a
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

// The splash screen lives in index.html (shown before any JS loads,
// 2026-11-15). The app removes it once there is something real to show -
// when the login check is done (app/providers/AppProviders) and on the error
// page - but never before its animation has played: public/splash.js puts the
// minimum on <html data-splash-min-ms> (full ~2.7 s, short 0.9 s).
export function hideSplash() {
  const splash = document.getElementById("splash")
  if (!splash || splash.dataset.hiding) return
  splash.dataset.hiding = "1"
  const minMs = Number(document.documentElement.dataset.splashMinMs || 0)
  const wait = Math.max(0, minMs - performance.now())
  window.setTimeout(() => {
    splash.classList.add("splash-hide")
    window.setTimeout(() => splash.remove(), 400)
  }, wait)
}

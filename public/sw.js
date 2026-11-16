// MyTracker service worker (PWA, 2026-11-12; instant start 2026-11-15).
//
// 1. Instant start: the start page (index.html) and the code files it uses are
//    kept on the phone (SHELL cache) and shown at once, without waiting for
//    the network. Meanwhile the fresh index.html is fetched; if a new version
//    was released, it and its files replace the old ones and the page gets a
//    "mytracker-new-version" message — public/splash.js then reloads the app
//    behind the splash, so people see the new version right away; if the
//    splash is already gone, the new one shows on the next launch (owner
//    decision 2026-11-15, replaces "cache nothing" from 2026-11-12).
// 2. Our own "No connection" page when offline and nothing is kept yet.
// 3. Push notifications (2026-11-12), sent by the server (server/src/lib/push).
// Data (/api) is never cached here.

// Bump the version whenever offline.html or offline.js change: the files are
// saved once, when this service worker installs.
const OFFLINE_CACHE = "mytracker-offline-v2"
const SHELL_CACHE = "mytracker-shell-v1"
const SHELL_KEY = "/__app-shell"
const OFFLINE_URL = "/offline.html"
const OFFLINE_ASSETS = [OFFLINE_URL, "/offline.js", "/icons/icon-192.png"]
const NEW_VERSION = "mytracker-new-version"

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then(cache => cache.addAll(OFFLINE_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", event => {
  const keep = [OFFLINE_CACHE, SHELL_CACHE]
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => !keep.includes(key)).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

// The code files a given index.html loads: /assets/index-<hash>.js|css.
function assetsOf(html) {
  return [...new Set(html.match(/\/assets\/[^"'\s>]+/g) || [])]
}

// Saves a fresh index.html and its files. Returns true if it differs from the
// kept one (a new release).
async function storeShell(cache, html, previousHtml) {
  if (html === previousHtml) return false
  const assets = assetsOf(html)
  await cache.addAll(assets)
  await cache.put(SHELL_KEY, new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } }))
  // Drop files only the old version used.
  const keys = await cache.keys()
  await Promise.all(
    keys
      .map(req => new URL(req.url).pathname)
      .filter(path => path.startsWith("/assets/") && !assets.includes(path))
      .map(path => cache.delete(path)),
  )
  return previousHtml !== null
}

async function tellPage(clientId) {
  const client = clientId ? await self.clients.get(clientId) : null
  const targets = client ? [client] : await self.clients.matchAll({ type: "window" })
  targets.forEach(target => target.postMessage(NEW_VERSION))
}

async function openPage(event) {
  const cache = await caches.open(SHELL_CACHE)
  const kept = await cache.match(SHELL_KEY)
  const keptHtml = kept ? await kept.clone().text() : null

  if (kept && self.navigator.onLine !== false) {
    // Show the kept version now; check for a new one in the background.
    event.waitUntil(
      fetch("/index.html", { cache: "no-store" })
        .then(async res => {
          if (!res.ok) return
          const isNew = await storeShell(cache, await res.text(), keptHtml)
          if (isNew) await tellPage(event.resultingClientId)
        })
        .catch(() => {}),
    )
    return kept
  }

  try {
    const res = await fetch(event.request)
    if (res.ok && (res.headers.get("Content-Type") || "").includes("text/html")) {
      const html = await res.clone().text()
      event.waitUntil(storeShell(cache, html, keptHtml).catch(() => {}))
    }
    return res
  } catch {
    return kept || (await caches.match(OFFLINE_URL)) || Response.error()
  }
}

self.addEventListener("fetch", event => {
  const { request } = event
  const url = new URL(request.url)
  if (url.origin !== location.origin) return

  // Page loads of the app (not /api links such as email confirmations, and
  // not the offline page itself — the app sends people there when the server
  // is unreachable; it is handled below).
  if (request.mode === "navigate" && !url.pathname.startsWith("/api/") && url.pathname !== OFFLINE_URL) {
    event.respondWith(openPage(event))
    return
  }
  // The app's code files: from the phone if kept (their names change with
  // every release, so a kept file is never outdated).
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches
        .open(SHELL_CACHE)
        .then(cache => cache.match(url.pathname))
        .then(kept => kept || fetch(request)),
    )
    return
  }
  // The offline page's own files.
  if (OFFLINE_ASSETS.includes(url.pathname)) {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(url.pathname)) || Response.error()),
    )
  }
})

// A push from our server: { title, body, tag, url } (server/src/lib/push/messages.ts).
self.addEventListener("push", event => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : "" }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "MyTracker", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag,
      renotify: Boolean(data.tag),
      data: { url: data.url || "/today" },
    }),
  )
})

// Tap on a notification: bring an open MyTracker window forward (and move it
// to the page), or open a new one.
self.addEventListener("notificationclick", event => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || "/today", self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(windows => {
      const open = windows.find(w => new URL(w.url).origin === self.location.origin)
      if (open) {
        return open.focus().then(w => (w && "navigate" in w ? w.navigate(url) : undefined))
      }
      return self.clients.openWindow(url)
    }),
  )
})

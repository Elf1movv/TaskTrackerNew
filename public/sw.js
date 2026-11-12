// MyTracker service worker (PWA, 2026-11-12).
//
// Deliberately minimal: it makes the site installable and gives a page of
// our own instead of the browser's "no internet" screen. It does NOT cache the
// app or the API — a cached app shell could keep someone on an old version
// after a deploy, and working offline with data was postponed by the owner
// (PRODUCT_STRATEGY.md, section 6). Push notifications will be added here.

const CACHE = "mytracker-offline-v1"
const OFFLINE_URL = "/offline.html"
const OFFLINE_ASSETS = [OFFLINE_URL, "/offline.js", "/icons/icon-192.png"]

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => cache.addAll(OFFLINE_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

// Network first, always. If the network is gone: a page load gets our offline
// page, and that page's own files (script, icon) come from the cache. Nothing
// else is touched — scripts and the API go straight to the network.
self.addEventListener("fetch", event => {
  const { request } = event
  const url = new URL(request.url)
  const isOfflineAsset = url.origin === location.origin && OFFLINE_ASSETS.includes(url.pathname)
  if (request.mode !== "navigate" && !isOfflineAsset) return
  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request.mode === "navigate" ? OFFLINE_URL : url.pathname)
      return cached ?? Response.error()
    }),
  )
})

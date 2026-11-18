// Splash screen helper (index.html, 2026-11-15). Runs before the page is drawn
// — a separate file because the site's security policy (CSP) forbids scripts
// inside the page.
;(function () {
  var root = document.documentElement
  var FULL_MS = 2700 // the "Stamp" animation: letters, then the logo stamp
  var SHORT_MS = 900 // a cold start within 30 min of the previous one
  var HOLD_MS = 350 // after a reload into a new version: the last frame only
  var mode = "full"
  try {
    if (localStorage.getItem("theme") === "light") root.dataset.splash = "light"
    var last = Number(localStorage.getItem("mytracker-last-start") || 0)
    if (Date.now() - last < 30 * 60 * 1000) mode = "short"
    localStorage.setItem("mytracker-last-start", String(Date.now()))
    // The previous page waited for its animation to finish and reloaded into
    // a new version (below): continue from the last frame instead of playing
    // the short version — the owner saw that as the splash "cut in half"
    // (2026-11-18).
    if (sessionStorage.getItem("mytracker-splash-hold")) {
      sessionStorage.removeItem("mytracker-splash-hold")
      mode = "hold"
    }
  } catch (e) {
    // Storage blocked — dark splash, full animation.
  }
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  root.dataset.splashMode = mode
  // How long the splash stays at least — read by hideSplash().
  root.dataset.splashMinMs = String(
    mode === "hold" ? HOLD_MS : reduced ? 300 : mode === "short" ? SHORT_MS : FULL_MS,
  )

  // The service worker found a new release (public/sw.js): while the splash is
  // still up, reload into it — nobody sees the old version.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", function (event) {
      if (event.data !== "mytracker-new-version") return
      var splash = document.getElementById("splash")
      if (!splash || splash.classList.contains("splash-hide") || splash.dataset.reloading) return
      // Let the animation finish first, then reload; the app must not hide
      // the splash meanwhile (hideSplash() skips a splash marked "hiding").
      splash.dataset.reloading = "1"
      splash.dataset.hiding = "1"
      var left = Number(root.dataset.splashMinMs || 0) - performance.now()
      setTimeout(function () {
        try {
          sessionStorage.setItem("mytracker-splash-hold", "1")
        } catch (e) {
          // Storage blocked — the next page plays the short version.
        }
        location.reload()
      }, Math.max(0, left))
    })
  }
})()

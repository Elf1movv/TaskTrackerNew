// Offline page (offline.html): theme, language, retry.
;(function () {
  var theme, lang
  try {
    theme = localStorage.getItem("theme")
    lang = localStorage.getItem("mytracker-language")
  } catch (e) {}
  if (theme === "light") document.documentElement.className = "light"
  if (lang === "en") {
    document.documentElement.lang = "en"
    document.getElementById("title").textContent = "No internet connection"
    document.getElementById("text").textContent =
      "MyTracker works online for now. The page will open by itself as soon as you're back online."
    document.getElementById("retry").textContent = "Try again"
  }
  // Opened directly as /offline.html?from=<page> (the app sends people here
  // when it can't reach the server): "try again" goes back to that page.
  function retry() {
    if (location.pathname !== "/offline.html") return location.reload()
    var from = new URLSearchParams(location.search).get("from") || "/today"
    location.replace(from.charAt(0) === "/" && from.charAt(1) !== "/" ? from : "/today")
  }
  document.getElementById("retry").addEventListener("click", retry)
  window.addEventListener("online", retry)
})()

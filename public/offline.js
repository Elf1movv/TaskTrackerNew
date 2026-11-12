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
  document.getElementById("retry").addEventListener("click", function () {
    location.reload()
  })
  window.addEventListener("online", function () {
    location.reload()
  })
})()

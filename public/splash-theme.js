// Splash screen colour (index.html, 2026-11-15): runs before the page is
// drawn, so the splash matches the theme the person chose. A separate file
// because the site's security policy (CSP) forbids scripts inside the page.
try {
  if (localStorage.getItem("theme") === "light") document.documentElement.dataset.splash = "light"
} catch (e) {
  // Storage blocked — the splash stays dark, like the app's default.
}

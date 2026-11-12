// PWA check (2026-11-12), run by scripts/qa/run-local.sh after the onboarding
// check: the site is installable, the service worker controls the page, the
// theme color follows the theme, our offline page shows when the server is
// gone (the server is stopped and started again — Chrome's "offline"
// emulation doesn't reach the service worker), and an iPhone gets the
// "Add to Home Screen" steps. Needs QA_ENV (the server's env file).
import assert from "node:assert/strict"
import { execSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { api, button, click, evaluate, fill, pause, qaFile, screenshot, send, wait, navigate, close, errors, origin } from "./cdp.mjs"
assert.equal(origin, "http://localhost:3002", "local only: the check stops the server")
const serverDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "server")
const text = v => `document.body.innerText.includes(${JSON.stringify(v)})`
const out = {}
const gear = "document.querySelector('[data-onboarding=\"settings-gear\"]')"
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await navigate("/today", gear)
const m = await evaluate(`fetch('/manifest.webmanifest').then(async r=>({ct:r.headers.get('content-type'),name:(await r.json()).name}))`)
out.manifest = m
await evaluate(`navigator.serviceWorker.ready.then(()=>true)`)
out.sw = await evaluate(`navigator.serviceWorker.controller ? 'controlled' : 'registered'`)
await navigate("/today", gear)
out.sw2 = await evaluate(`navigator.serviceWorker.controller ? 'controlled' : 'none'`)
out.installErrors = (await send("Page.getInstallabilityErrors")).installabilityErrors
out.manifestIcons = (await send("Page.getAppManifest")).errors
out.themeColor = await evaluate(`[localStorage.getItem('theme'), document.documentElement.className, document.querySelector('meta[name=theme-color]').content]`)
// offline page
execSync(`for pid in $(netstat -ano | grep -E ":3002 .*LISTENING" | awk '{print $5}' | sort -u); do taskkill //PID $pid //F //T; done`, { shell: "bash", stdio: "ignore" })
await pause(1000)
await send("Page.navigate", { url: origin + "/tasks" })
await wait(text("Нет подключения к интернету"))
await pause(800)
out.offlineImg = await evaluate(`document.querySelector('img').naturalWidth`)
await screenshot("pwa-offline")
const env = process.env.QA_ENV
execSync(`cd "${serverDir.split(path.sep).join("/")}" && (nohup npx tsx --env-file="${env}" src/index.ts > "${qaFile("server-restarted.log").split(path.sep).join("/")}" 2>&1 &) ; for i in $(seq 1 40); do curl -s -m 2 http://localhost:3002/api/health | grep -q ok && break; sleep 1; done`, { shell: "bash", stdio: "ignore" })
await click(button("Повторить"))
await wait(`location.pathname==='/tasks' && ${gear}`)
out.backOnline = true
// iPhone (a real iPhone never fires Chrome's install event — block it here)
await send("Page.addScriptToEvaluateOnNewDocument", { source: "window.addEventListener('beforeinstallprompt', e => e.stopImmediatePropagation(), true)" })
await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" })
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
await navigate("/today", gear)
await click(gear)
await click(button("Установить приложение"))
await wait(text("Установить MyTracker на iPhone"))
await pause(500)
await screenshot("pwa-ios")
await click(button("Понятно"))
await send("Emulation.setUserAgentOverride", { userAgent: "" })
// Push notifications (2026-11-12): the offer on Today, turning them on in
// settings (a real subscription at the browser's push service), a real test
// notification through it, the settings saved, turning them off.
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await send("Browser.grantPermissions", { permissions: ["notifications"], origin })
await navigate("/today", gear)
await evaluate(`navigator.serviceWorker.ready.then(r=>r.pushManager.getSubscription()).then(s=>s&&s.unsubscribe())`)
await navigate("/today", gear)
await wait(text("Включить уведомления?"))
out.pushOffer = true
await click(gear)
await pause(700)
await click(`[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Уведомления')`)
await click(button("Включены"))
await wait(button("Отправить тестовое уведомление"))
await pause(600) // the offer's exit animation
out.pushOfferGone = !(await evaluate(text("Включить уведомления?")))
out.pushTimeZone = (await api("me/notifications")).timeZone
await click(button("Отправить тестовое уведомление"))
await wait(`${text("Отправили")} || ${text("Не получилось отправить")}`)
out.pushTest = (await evaluate(text("Отправили"))) ? "delivered" : "failed"
await fill("input[type=time]", "07:45")
await pause(800)
out.pushTime = (await api("me/notifications")).notifyTime
await api("me/notifications", "PUT", { notifyTime: "09:00" })
await click(button("Выключены"))
// Turning off first tells the server, then unsubscribes — wait for it rather
// than a fixed pause (a slow request made a 1.5 s pause flaky, 2026-11-12).
out.pushOffAfter = false
for (let i = 0; i < 50 && !out.pushOffAfter; i++) {
  await pause(200)
  out.pushOffAfter = !(await evaluate(`navigator.serviceWorker.ready.then(r=>r.pushManager.getSubscription()).then(s=>!!s)`))
}
out.errors = errors
assert.equal(out.manifest.name, "MyTracker")
assert.match(out.manifest.ct, /manifest\+json/)
assert.equal(out.sw2, "controlled", "service worker controls the page")
assert.deepEqual(out.installErrors, [], "installable")
assert.equal(out.themeColor[2], "#0b1117", "theme color = dark background")
assert(out.pushOffer && out.pushOfferGone, "push offer on Today, gone once turned on")
assert(out.pushTimeZone, "time zone saved with the subscription")
assert.equal(out.pushTest, "delivered", "a real test push went through the push service")
assert.equal(out.pushTime, "07:45", "morning time saved")
assert(out.pushOffAfter, "turning off removes the subscription")
assert.deepEqual(errors, [], "no runtime errors")
console.log(`pwa: ok ${JSON.stringify(out)}`)
close()

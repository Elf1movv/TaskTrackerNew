// Speed check on a "weak phone" (speed iteration 2026-11-18, docs/PERFORMANCE.md):
// 4x slower CPU, 1.6 Mbit/s, 150 ms latency, 390 px, a cold start (no browser
// cache, no copy kept by the service worker). Prints JSON and a WARN line if the
// start is slower than the budget, if the same /api address is asked twice on
// start, or if anything still comes from another server (fonts, scripts).
// Run after the suite, in the same logged-in QA browser (run-local.sh does it).
import { close, evaluate, origin, pause, send, wait } from "./cdp.mjs"

const START_BUDGET_MS = 3000
const result = {}
const warnings = []

await send("Network.enable")
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
await send("Emulation.setCPUThrottlingRate", { rate: 4 })
await send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 150,
  downloadThroughput: 1.6e6 / 8,
  uploadThroughput: 750e3 / 8,
})

async function coldStart(path, ready) {
  await send("Network.clearBrowserCache")
  await send("Storage.clearDataForOrigin", { origin, storageTypes: "service_workers,cache_storage" })
  const started = Date.now()
  await send("Page.navigate", { url: origin + path })
  await wait(ready)
  const ms = Date.now() - started
  // Let late requests (lazy screen code, fonts) finish before counting them.
  await pause(1500)
  const entries = await evaluate(
    "performance.getEntriesByType('resource').map(e=>({u:e.name,kb:Math.round(e.transferSize/1024),t:e.initiatorType}))",
  )
  const own = entries.filter(e => e.u.startsWith(origin))
  const api = own.filter(e => new URL(e.u).pathname.startsWith("/api/")).map(e => new URL(e.u).pathname)
  const repeated = [...new Set(api.filter((p, i) => api.indexOf(p) !== i))]
  return {
    ms,
    codeKb: own.filter(e => e.u.endsWith(".js")).reduce((sum, e) => sum + e.kb, 0),
    fontKb: own.filter(e => e.u.endsWith(".woff2")).reduce((sum, e) => sum + e.kb, 0),
    apiRequests: api.length,
    repeatedApi: repeated,
    otherServers: [...new Set(entries.filter(e => !e.u.startsWith(origin)).map(e => new URL(e.u).host))],
  }
}

const mainReady = "document.querySelector('main h1')"
result.today = await coldStart("/today", mainReady)
result.habits = await coldStart("/habits", mainReady)

// Switching the phone Habits view to Year (heaviest calculation on screen).
result.habits.yearSwitchMs = await evaluate(`(async()=>{
  const b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Год')
  if(!b) return null
  const t=performance.now(); b.click()
  await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)))
  return Math.round(performance.now()-t)})()`)

for (const [name, r] of Object.entries(result)) {
  if (r.ms > START_BUDGET_MS) warnings.push(`${name}: start ${r.ms} ms > ${START_BUDGET_MS} ms`)
  if (r.repeatedApi.length) warnings.push(`${name}: same request twice: ${r.repeatedApi.join(", ")}`)
  if (r.otherServers.length) warnings.push(`${name}: loads from ${r.otherServers.join(", ")}`)
}

await send("Emulation.setCPUThrottlingRate", { rate: 1 })
await send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
console.log("perf: " + JSON.stringify(result))
for (const w of warnings) console.log("perf WARN " + w)
close()

import assert from "node:assert/strict"
import fs from "node:fs/promises"
import {
  send,
  evaluate,
  wait,
  navigate,
  api,
  close,
  errors,
  pause,
  saved,
  drag,
  screenshot,
  origin,
} from "./cdp.mjs"
const passed = []
const ok = message => {
  passed.push(message)
  console.log("PASS " + message)
}
try {
  const session = await api("auth/get-session")
  assert(
    /^independence-[a-f0-9-]+@example.invalid$/.test(session?.user?.email),
    "Disposable QA session required",
  )
  const tasks = await api("tasks"),
    notes = await api("notes")
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1200,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await send("Emulation.setTouchEmulationEnabled", { enabled: false })
  const plan = (await api("plans")).find(p => p.title === "План 20 минут")
  assert(plan)
  await api(`plans/${plan.id}`, "PATCH", {
    patch: { onHold: false, date: "2030-01-15", time: "14:00", endTime: "14:20" },
    expectedUpdatedAt: plan.updatedAt,
  })
  const block = "[...document.querySelectorAll('[role=button]')].find(e=>e.title?.includes('План 20 минут'))"
  await navigate("/calendar?view=week&date=2030-01-15", block)
  // Resolve geometry after scrolling the source into view, just as drag() does.
  const gridPoint = async (day, hour) =>
    evaluate(
      `(()=>{(${block})?.scrollIntoView({block:'center'});const r=document.querySelector('[data-calendar-day="${day}"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.top+${hour}*64}})()`,
    )
  await drag(block, await gridPoint("2030-01-16", 15))
  await saved(async () => (await api("plans")).find(p => p.id === plan.id).date === "2030-01-16")
  let changed = (await api("plans")).find(p => p.id === plan.id)
  assert.equal(changed.time, "15:00")
  assert.equal(changed.endTime, "15:20")
  assert.equal(changed.durationMinutes, 20)
  ok("Week drag changes day/time and preserves exact 20 minutes")
  const resize = `(${block}).querySelector('.cursor-ns-resize')`
  await drag(resize, await gridPoint("2030-01-16", 16))
  await saved(async () => (await api("plans")).find(p => p.id === plan.id).endTime === "16:00")
  assert.equal((await api("plans")).find(p => p.id === plan.id).durationMinutes, 60)
  ok("Resize persists a new duration")
  await drag(block, "document.querySelector('[data-plan-hold]')")
  await saved(async () => (await api("plans")).find(p => p.id === plan.id).onHold)
  assert.equal((await api("plans")).find(p => p.id === plan.id).durationMinutes, 60)
  ok("Drag from timeline to On hold")
  const held =
    "[...document.querySelectorAll('[data-plan-hold] button')].find(e=>e.textContent.includes('План 20 минут'))"
  await wait(held)
  const fromHold = await evaluate(
    `(()=>{(${held}).scrollIntoView({block:'center'});const r=document.querySelector('[data-calendar-day="2030-01-17"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.top+15*64}})()`,
  )
  await drag(held, fromHold)
  await saved(async () => !(await api("plans")).find(p => p.id === plan.id).onHold)
  changed = (await api("plans")).find(p => p.id === plan.id)
  assert.equal(changed.date, "2030-01-17")
  assert.equal(changed.durationMinutes, 60)
  ok("Drag from On hold back into weekly schedule")
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  })
  await navigate("/calendar?view=day&date=2030-01-17", block)
  await drag(block, "document.querySelector('[data-plan-hold]')", true)
  await saved(async () => (await api("plans")).find(p => p.id === plan.id).onHold)
  ok("Touch drag moves plan into On hold")
  await screenshot("calendar-mobile")
  assert(await evaluate("document.documentElement.scrollWidth<=390"))
  assert.deepEqual(await api("tasks"), tasks)
  assert.deepEqual(await api("notes"), notes)
  ok("Calendar gestures leave tasks and notes unchanged; mobile width fits")
  assert.equal(errors.length, 0)
  await fs.writeFile(
    "/private/tmp/mytracker-calendar-gestures-results.json",
    JSON.stringify({ origin, passed, errors }, null, 2),
  )
  console.log(JSON.stringify({ passed: passed.length, errors: errors.length }))
} catch (error) {
  console.error(error.message)
  await screenshot("calendar-failure")
  process.exitCode = 1
} finally {
  close()
}

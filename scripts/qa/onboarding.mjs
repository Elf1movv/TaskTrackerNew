// Browser check of the first-run onboarding ("знакомство"), run by
// scripts/qa/run-local.sh after the main suite, on the same disposable user.
// QA_RESET is a shell command that sets the user's onboarding status back to
// "not seen" (server/scripts/qa-browser-user.mjs onboarding-reset).
//
// Scenarios: full walkthrough on desktop (dark, ru) ending with the habit
// checked off from the spotlight; skip on a phone → hint at the gear →
// "Take the tour again" from settings; light theme + English + reduced motion.
import assert from "node:assert/strict"
import { execSync } from "node:child_process"
import { api, button, click, close, errors, evaluate, fill, navigate, pause, saved, screenshot, send, wait } from "./cdp.mjs"

const passed = []
const ok = message => {
  passed.push(message)
  console.log("PASS " + message)
}
const reset = () => execSync(process.env.QA_RESET, { shell: "bash", stdio: "ignore" })
const text = value => `document.body.innerText.includes(${JSON.stringify(value)})`
const dialog = "document.querySelector('[role=dialog]')"
const byLabel = label => `document.querySelector('[aria-label=${JSON.stringify(label)}]')`
const desktop = { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }
const phone = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
const setStorage = (entries) =>
  evaluate(`(()=>{${Object.entries(entries).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)},${JSON.stringify(v)})`).join(";")}})()`)

try {
  const session = await api("auth/get-session")
  assert(/^independence-[a-f0-9-]+@example.invalid$/.test(session?.user?.email), "Disposable QA session required")

  // --- 1. Full walkthrough, desktop, dark, Russian -------------------------
  await send("Emulation.setDeviceMetricsOverride", desktop)
  await setStorage({ theme: "dark", "mytracker-language": "ru" })
  reset()
  await navigate("/tasks", text("Добро пожаловать в MyTracker"))
  assert.equal(await evaluate("location.pathname"), "/today", "onboarding moves to Today")
  await screenshot("onboarding-welcome-desktop")
  ok("Opens by itself for a new account, on Today")

  await click(button("Начать"))
  await wait(text("Что вы хотите делать регулярно?"))
  await click(button("Бег"))
  assert.equal(await evaluate(`${byLabel("Или впишите свою")}.value`), "Бег")
  const presetTops = await evaluate(
    `[...document.querySelectorAll('[role=dialog] button[aria-pressed]')].slice(0,4).map(b=>Math.round(b.getBoundingClientRect().top))`,
  )
  assert.equal(new Set(presetTops).size, 1, "four presets in one row")
  await screenshot("onboarding-habit-desktop")
  await click(button("Создать привычку"))
  await wait(text("Ваша привычка готова"))
  await click(byLabel("Следующий вид"))
  await wait(text("Список — строками"))
  await pause(400)
  await screenshot("onboarding-habit-features-desktop")
  ok("Habit created from a preset, features screen with view switcher")

  await click(button("Дальше"))
  await wait(text("Какое дело нужно сделать?"))
  await fill('[aria-label="Например, записаться к врачу"]', "Записаться к врачу")
  await click(button("+ Своя"))
  await fill('[aria-label="Название категории"]', "Дом QA")
  await click(`document.querySelector('[role=dialog] button[aria-label="+ Своя"]')`)
  await click(button("Сегодня"))
  await screenshot("onboarding-task-desktop")
  await click(button("Создать задачу"))

  await wait(text("К чему вы идёте?"))
  await fill('[aria-label="Например, пробежать 5 км"]', "Пробежать 5 км QA")
  await fill('[aria-label="Первый этап, если хотите: «купить кроссовки»"]', "Купить кроссовки")
  await click(button("Создать цель"))
  await wait(text("Как устроена цель"))
  await screenshot("onboarding-goal-structure-desktop")
  await click(button("Дальше"))
  await wait(text("Ещё три инструмента на каждый день"))
  await click(button("Дальше"))
  await wait(text("MyTracker ещё растёт"))
  await screenshot("onboarding-feedback-desktop")
  await click(button("Показать мой день"))
  await wait(text("Готово! Ваш день собран"))
  await pause(300)
  await screenshot("onboarding-finale-desktop")
  ok("Task with a new category, goal with a first step, info screens, finale")

  await click(button("Посмотреть"))
  await wait(text("Сделали сегодня?"))
  await pause(700)
  await screenshot("onboarding-spotlight-desktop")
  const habit = (await api("habits")).findLast(h => h.title === "Бег")
  assert(habit, "habit saved")
  await click(`document.querySelector('[data-onboarding-habit="${habit.id}"] button')`)
  await saved(async () => (await api("habits")).find(h => h.id === habit.id)?.completedDates.includes(todayKey()))
  await wait(`!${text("Сделали сегодня?")}`)
  assert.equal((await api("me/onboarding")).status, "completed")
  const task = (await api("tasks")).findLast(t => t.title === "Записаться к врачу")
  assert.equal(task?.category, "Дом QA")
  assert.equal(task?.dueDate, todayKey())
  assert((await api("categories")).some(c => c.name === "Дом QA"))
  const goal = (await api("goals")).findLast(g => g.title === "Пробежать 5 км QA")
  assert.equal(goal?.milestones[0]?.title, "Купить кроссовки")
  assert(goal?.targetDate, "goal has a deadline")
  ok("Spotlight check-off saves the habit and status 'completed'; records are real")

  await navigate("/today", "document.querySelector('[data-onboarding=\"settings-gear\"]')")
  await pause(800)
  assert(!(await evaluate(`Boolean(${dialog})`)), "does not reopen once completed")
  ok("Does not reopen after completion")

  // --- 2. Phone: skip → hint → take the tour again -------------------------
  await send("Emulation.setDeviceMetricsOverride", phone)
  reset()
  await navigate("/today", text("Добро пожаловать в MyTracker"))
  await pause(400)
  await screenshot("onboarding-welcome-mobile")
  await click(button("Начать"))
  await wait(text("Что вы хотите делать регулярно?"))
  const mobileTops = await evaluate(
    `[...document.querySelectorAll('[role=dialog] button[aria-pressed]')].slice(0,4).map(b=>Math.round(b.getBoundingClientRect().top))`,
  )
  assert.equal(new Set(mobileTops).size, 1, "four presets in one row on a phone")
  const overflow = await evaluate(`(()=>{const d=${dialog};return d.scrollWidth>d.clientWidth+1})()`)
  assert(!overflow, "no horizontal overflow on a phone")
  await screenshot("onboarding-habit-mobile")
  await click(button("Пропустить знакомство"))
  await wait(text("Знакомство можно пройти позже"))
  await pause(500)
  await screenshot("onboarding-hint-mobile")
  assert.equal((await api("me/onboarding")).status, "skipped")
  await click(button("Понятно"))
  await wait(`!${text("Знакомство можно пройти позже")}`)
  ok("Phone: one-row presets, skip saves 'skipped' and shows the gear hint")

  await click("document.querySelector('[data-onboarding=\"settings-gear\"]')")
  await click(button("Пройти знакомство заново"))
  await wait(text("Добро пожаловать в MyTracker"))
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 })
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 })
  await wait(`!${dialog}`)
  await pause(400)
  assert(!(await evaluate(text("Знакомство можно пройти позже"))), "no hint on a rerun")
  assert.equal((await api("me/onboarding")).status, "skipped", "skipping a rerun keeps the status")
  ok("Settings → 'Take the tour again' reopens it; Esc skips without a second hint")

  // --- 3. Light theme, English, reduced motion -----------------------------
  await send("Emulation.setDeviceMetricsOverride", desktop)
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] })
  await setStorage({ theme: "light", "mytracker-language": "en" })
  reset()
  await navigate("/today", text("Welcome to MyTracker"))
  await click(button("Start"))
  await wait(text("What do you want to do regularly?"))
  await click(button("Create habit"))
  await wait(text("Your habit is ready"))
  await pause(300)
  await screenshot("onboarding-habit-features-light-en")
  await click(button("Skip the tour"))
  await wait(text("You can take the tour later"))
  await screenshot("onboarding-hint-light-en")
  await click(button("Got it"))
  ok("Light theme, English texts and reduced motion work")

  assert.deepEqual(errors, [], "no runtime errors")
  ok("No runtime errors")
} catch (error) {
  await screenshot("onboarding-failure").catch(() => {})
  console.error("FAIL", error.message)
  process.exitCode = 1
} finally {
  // Whatever happened above, leave the user with the onboarding done, so it
  // doesn't cover the screen for the scripts that run after this one.
  await api("me/onboarding", "PUT", { status: "completed" }).catch(() => {})
  await send("Emulation.setEmulatedMedia", { features: [] }).catch(() => {})
  await setStorage({ theme: "dark", "mytracker-language": "ru" }).catch(() => {})
  console.log(`onboarding: ${passed.length} passed`)
  close()
}

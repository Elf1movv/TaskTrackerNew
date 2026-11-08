import fs from "node:fs/promises"
import assert from "node:assert/strict"
import {
  send,
  evaluate,
  wait,
  click,
  fill,
  button,
  navigate,
  screenshot,
  api,
  close,
  errors,
  pause,
  saved,
  drag,
  origin,
  qaFile,
} from "./cdp.mjs"
const credentials = process.env.QA_CREDENTIALS ?? qaFile("mytracker-independent-login.json")
const mode = process.argv[2] ?? "suite"
const passed = []
const ok = message => {
  passed.push(message)
  console.log("PASS " + message)
}
const row = id => `document.querySelector('[data-note-id="${id}"]')`
const rowButton = (id, label) => `${row(id)}?.querySelector('[aria-label="${label}"]')`
const grip = id => rowButton(id, "Переместить заметку (стрелки вверх/вниз)")
try {
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await send("Emulation.setTouchEmulationEnabled", { enabled: false })
  await send("Network.clearBrowserCookies")
  await navigate("/login", "document.querySelector('input[type=email]')")
  await evaluate("localStorage.setItem('mytracker-language','ru')")
  if (mode === "register") {
    const login = {
      email: `independence-${crypto.randomUUID()}@example.invalid`,
      password: `QA-${crypto.randomUUID()}`,
    }
    await fs.writeFile(credentials, JSON.stringify(login), { mode: 0o600 })
    await api("auth/sign-up/email", "POST", { ...login, name: "Independence QA" })
    console.log(JSON.stringify({ registered: true, email: login.email, origin }))
  } else {
    assert.equal(mode, "suite")
    const login = JSON.parse(await fs.readFile(credentials, "utf8"))
    assert(/^independence-[a-f0-9-]+@example.invalid$/.test(login.email), "Disposable QA credentials only")
    await api("auth/sign-in/email", "POST", login)
    const session = await api("auth/get-session")
    assert.equal(session.user.email, login.email, "Refuse cleanup outside this QA account")
    for (const path of ["notes", "plans", "tasks", "goals"])
      for (const item of await api(path)) await api(`${path}/${item.id}`, "DELETE")
    await navigate("/today", "document.body.innerText.includes('Заметки')")
    await click(button("Добавить заметку"))
    await fill('input[placeholder="Что нужно держать перед глазами?"]', "Первая заметка")
    await fill('textarea[placeholder="Описание — при необходимости"]', "Одна строка описания")
    await click(button("Сохранить"))
    await saved(async () => (await api("notes")).length === 1)
    const first = (await api("notes"))[0]
    await wait(row(first.id))
    assert(!(await evaluate("document.body.innerText.includes('Одна строка описания')")))
    await click(`${row(first.id)}.querySelector('[aria-expanded]')`)
    await wait("document.body.innerText.includes('Одна строка описания')")
    await click(`${row(first.id)}.querySelector('[aria-expanded]')`)
    assert(!(await evaluate("document.body.innerText.includes('Одна строка описания')")))
    ok("Short description opens and closes")
    await click(rowButton(first.id, "Выполнить заметку"))
    await saved(async () => (await api("notes"))[0].completed)
    await navigate("/today", row(first.id))
    assert(
      await evaluate(
        `${row(first.id)}.querySelector('[role=checkbox]').getAttribute('aria-checked')==='true'`,
      ),
    )
    assert.equal((await api("notes"))[0].archivedAt, null)
    await click(rowButton(first.id, "Отменить выполнение заметки"))
    await saved(async () => !(await api("notes"))[0].completed)
    ok("Completion persists and reverses without archive")
    const second = await api("notes", "POST", {
      id: crypto.randomUUID(),
      title: "Вторая заметка",
      description: null,
      archivedAt: null,
    })
    await navigate("/today", row(second.id))
    await drag(grip(second.id), row(first.id))
    await saved(async () => (await api("notes"))[0].id === second.id)
    await navigate("/today", row(first.id))
    assert.deepEqual(
      await evaluate("[...document.querySelectorAll('[data-note-id]')].map(e=>e.dataset.noteId)"),
      [second.id, first.id],
    )
    ok("Mouse reorder persists after reload")
    await drag(grip(first.id), row(second.id))
    await saved(async () => (await api("notes"))[0].id === first.id)
    await drag(grip(first.id), row(second.id))
    await saved(async () => (await api("notes"))[0].id === second.id)
    ok("Repeated drags of the same note work")
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    })
    await drag(grip(first.id), row(second.id), true)
    await saved(async () => (await api("notes"))[0].id === first.id)
    assert(await evaluate("document.documentElement.scrollWidth<=390"))
    await screenshot("notes-mobile")
    ok("Touch reorder and mobile width")
    const long = "Длинное описание\n" + "Подробности ".repeat(80) + "\n" + "длинноеслово".repeat(40)
    await click(rowButton(first.id, "Редактировать заметку"))
    await fill("textarea", long)
    await click(button("Сохранить"))
    await saved(async () => (await api("notes")).find(n => n.id === first.id).description === long)
    await click(`${row(first.id)}.querySelector('[aria-expanded]')`)
    assert(await evaluate("document.documentElement.scrollWidth<=390"))
    await screenshot("notes-description-mobile")
    ok("Long description edits and expands within mobile card")
    await send("Emulation.setTouchEmulationEnabled", { enabled: false })
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1100,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await click(rowButton(first.id, "Удалить заметку"))
    await click(
      "[...document.querySelectorAll('[role=alertdialog] button')].find(e=>e.textContent==='Отмена')",
    )
    assert.equal((await api("notes")).length, 2)
    ok("Cancel deletion preserves note")
    await click(rowButton(first.id, "В архив"))
    await saved(async () => !!(await api("notes")).find(n => n.id === first.id).archivedAt)
    await click(button("Архив"))
    await wait(row(first.id))
    await click(rowButton(first.id, "Восстановить"))
    await click(button("Актуальные"))
    await wait(row(first.id))
    ok("Archive and restore")
    assert(!(await evaluate("document.body.innerText.includes('Предстоящие')")), "Notes are undated")
    for (const tab of ["Актуальные", "Архив"]) {
      const n = await api("notes", "POST", {
        id: crypto.randomUUID(),
        title: "Удаление " + tab,
        description: null,
        archivedAt: tab === "Архив" ? new Date().toISOString() : null,
      })
      await navigate("/today", "document.body.innerText.includes('Заметки')")
      await click(button(tab))
      await wait(row(n.id))
      await click(rowButton(n.id, "Удалить заметку"))
      await click(
        "[...document.querySelectorAll('[role=alertdialog] button')].find(e=>e.textContent==='Удалить')",
      )
      await saved(async () => !(await api("notes")).some(x => x.id === n.id))
      ok("Delete from " + tab)
    }
    const toMove = await api("notes", "POST", {
      id: crypto.randomUUID(),
      title: "Заметка в задачу",
      description: "Описание переедет",
      archivedAt: null,
    })
    await navigate("/today", row(toMove.id))
    await click(rowButton(toMove.id, "Перенести в задачи"))
    await wait(
      "document.querySelector('input[placeholder=\"Что нужно сделать?\"]')?.value==='Заметка в задачу'",
    )
    await click(button("Добавить задачу"))
    await saved(async () => (await api("tasks")).some(t => t.title === "Заметка в задачу"))
    const movedTask = (await api("tasks")).find(t => t.title === "Заметка в задачу")
    assert.equal(movedTask.description, "Описание переедет")
    assert(!(await api("notes")).some(n => n.id === toMove.id), "Moved note is gone")
    await api(`tasks/${movedTask.id}`, "DELETE")
    ok("Note moves to tasks in one step")
    await navigate("/tasks", "document.body.innerText.includes('Добавить задачу')")
    await click(button("Добавить задачу"))
    await fill('input[placeholder="Что нужно сделать?"]', "Общее дело")
    assert(!(await evaluate("document.body.innerText.includes('Без цели')")))
    await click(
      "[...document.querySelectorAll('button')].filter(e=>e.textContent.trim()==='Добавить задачу').slice(-1)[0]",
    )
    await saved(async () => (await api("tasks")).length === 1)
    const task = (await api("tasks"))[0]
    assert.equal((await api("plans")).length, 0)
    assert(!(await evaluate("document.body.innerText.includes('Запланировать')")))
    ok("Task creates no plan and has no goal binding")
    await navigate("/goals", "document.body.innerText.includes('Добавить цель')")
    await click(button("Добавить цель"))
    await fill('input[placeholder="Название цели"]', "Моя цель")
    await click(
      "[...document.querySelectorAll('button')].filter(e=>e.textContent.trim()==='Добавить цель').slice(-1)[0]",
    )
    await saved(async () => (await api("goals")).length === 1)
    const goal = (await api("goals"))[0]
    await click(
      "[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Моя цель')&&e.hasAttribute('aria-expanded'))",
    )
    await fill('input[placeholder="Добавить этап…"]', "Первый шаг")
    await click("document.querySelector('[aria-label=\"Add milestone\"]')")
    await saved(async () => (await api("goals"))[0].milestones.length === 1)
    await click("document.querySelector('[aria-label=\"Mark milestone as done\"]')")
    await saved(async () => (await api("goals"))[0].progress === 100)
    await navigate("/goals", "document.body.innerText.includes('100%')")
    assert.equal((await api("tasks")).length, 1)
    assert.equal((await api("tasks"))[0].completed, false)
    assert.equal((await api("plans")).length, 0)
    ok("Own goal milestones and progress persist independently")
    // After the reload the first goal opens by itself (GoalList, fixed
    // 2026-11-09 — it used to stay collapsed); check that, no click needed.
    await wait(
      "[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Моя цель')&&e.getAttribute('aria-expanded')==='true')",
    )
    await fill('input[placeholder="Добавить подцель…"]', "Бэкенд")
    await click("document.querySelector('[aria-label=\"Add subgoal\"]')")
    await saved(async () => (await api("goals"))[0].subgoals.length === 1)
    // 1 own step done + an empty subgoal → (1 + 0) / 2 = 50%
    assert.equal((await api("goals"))[0].progress, 50)
    const subgoalId = (await api("goals"))[0].subgoals[0].id
    await click(`document.querySelector('[data-subgoal-id="${subgoalId}"] [aria-expanded]')`)
    await fill(`[data-subgoal-id="${subgoalId}"] input[placeholder="Добавить этап…"]`, "Регистрация")
    await click(`document.querySelector('[data-subgoal-id="${subgoalId}"] [aria-label="Add milestone"]')`)
    await saved(async () => (await api("goals"))[0].subgoals[0].milestones.length === 1)
    await click(
      `document.querySelector('[data-subgoal-id="${subgoalId}"] [aria-label="Mark milestone as done"]')`,
    )
    await saved(async () => (await api("goals"))[0].progress === 100)
    ok("Subgoal with its own step counts toward goal progress")
    await screenshot("goals-desktop")
    await navigate(
      "/calendar?view=month&date=2030-01-15",
      "document.querySelector('[aria-label=\"Add task\"]')",
    )
    await click("document.querySelector('[aria-label=\"Add task\"]')")
    await fill('input[placeholder="Добавить план"]', "План выбранного дня")
    await click(button("Сохранить"))
    await saved(async () => (await api("plans")).length === 1)
    const plan = (await api("plans"))[0]
    assert.equal(plan.date, "2030-01-15")
    assert.equal(plan.time, null)
    assert.equal((await api("tasks")).length, 1)
    ok("Calendar inherits selected date without task duplication")
    await navigate(
      "/calendar?view=day&date=2030-01-15",
      "document.body.innerText.includes('План выбранного дня')",
    )
    assert(await evaluate("document.body.innerText.includes('Без времени')"))
    const timed = await api("plans", "POST", {
      id: crypto.randomUUID(),
      title: "План 20 минут",
      description: "Сохранить описание",
      date: "2030-01-15",
      time: "14:00",
      endTime: "14:20",
      durationMinutes: 20,
      onHold: false,
      completed: false,
      category: "",
      priority: "medium",
    })
    const block =
      "[...document.querySelectorAll('[role=button]')].find(e=>e.title?.includes('План 20 минут'))"
    await navigate("/calendar?view=day&date=2030-01-15", block)
    await click(block)
    await click(button("Отложено"))
    await click(button("Сохранить"))
    await saved(async () => (await api("plans")).find(p => p.id === timed.id).onHold)
    const held = (await api("plans")).find(p => p.id === timed.id)
    assert.equal(held.durationMinutes, 20)
    assert.equal(held.description, "Сохранить описание")
    assert.equal(held.date, null)
    await navigate(
      "/calendar?view=day&date=2030-01-16",
      "document.querySelector('[data-plan-hold]')?.innerText.includes('План 20 минут')",
    )
    ok("On hold persists across days with duration and description")
    await click(
      "[...document.querySelectorAll('[data-plan-hold] button')].find(e=>e.textContent.includes('План 20 минут'))",
    )
    await click(button("Отложено"))
    await click(button("Сохранить"))
    await saved(async () => !(await api("plans")).find(p => p.id === timed.id).onHold)
    assert.equal((await api("plans")).find(p => p.id === timed.id).date, "2030-01-16")
    assert.equal((await api("tasks")).length, 1)
    ok("Return from hold uses selected day without task duplication")
    await api(`tasks/${task.id}`, "PATCH", {
      patch: { completed: true },
      expectedUpdatedAt: (await api("tasks"))[0].updatedAt,
    })
    assert((await api("plans")).every(p => !p.completed))
    await api(`goals/${goal.id}`, "DELETE")
    assert.equal((await api("plans")).length, 2)
    assert.equal((await api("tasks")).length, 1)
    ok("Task completion and goal deletion leave plans intact")
    await navigate("/today", "document.body.innerText.includes('Заметки')")
    assert(
      !(await evaluate(
        "document.body.innerText.includes('План выбранного дня') || document.body.innerText.includes('План 20 минут') || document.body.innerText.includes('Общее дело')",
      )),
    )
    ok("Today shows notes, not other days' schedule")
    assert(
      !(await evaluate("Boolean(document.querySelector('[data-today-plan]'))")),
      "No plan strip on Today",
    )
    ok("Today has no schedule strip (calendar owns the day plan)")
    await screenshot("today-desktop")
    assert.equal(errors.length, 0, JSON.stringify(errors))
    await fs.writeFile(
      qaFile("mytracker-independent-browser-results.json"),
      JSON.stringify({ origin, passed, errors }, null, 2),
    )
    console.log(JSON.stringify({ passed: passed.length, errors: errors.length }))
  }
} catch (error) {
  console.error(error.message)
  await screenshot("failure")
  process.exitCode = 1
} finally {
  close()
}

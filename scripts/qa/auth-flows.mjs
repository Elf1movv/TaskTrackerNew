// Browser check of the auth flows (login, logout, registration, email
// verification, password reset, auth cookies, rate limit) — written for the
// 2026-11-08 better-auth upgrade, reusable for the next one.
//   local:   node scripts/qa/auth-flows.mjs local    (QA_SERVER_LOG = log of a
//            local :3002 server WITHOUT EMAIL_DELIVERY=disabled and without
//            RESEND_API_KEY, so email links are printed there)
//   staging: QA_ORIGIN=https://test.mytracker.space node scripts/qa/auth-flows.mjs staging
//            (QA_CREDENTIALS must hold an already verified disposable login)
// Only disposable independence-…@example.invalid accounts; never prints a
// password or token.
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import {
  button,
  click,
  close,
  errors,
  evaluate,
  fill,
  navigate,
  origin,
  pause,
  qaFile,
  send,
  wait,
} from "./cdp.mjs"

const mode = process.argv[2]
assert(["local", "staging"].includes(mode), "Use local or staging")
const credentials = process.env.QA_CREDENTIALS ?? qaFile("mytracker-auth-login.json")
const results = []
const ok = message => {
  results.push(message)
  console.log("PASS " + message)
}
const text = value => `document.body.innerText.includes(${JSON.stringify(value)})`
const path = () => evaluate("location.pathname + location.search")
const session = () => evaluate("fetch('/api/auth/get-session').then(r=>r.json())")

async function emailLink(email, subject, first = false) {
  const log = await fs.readFile(process.env.QA_SERVER_LOG, "utf8")
  const blocks = log
    .split("[email] (dev, not sent)")
    .filter(b => b.includes(`to=${email}`) && b.includes(subject))
  assert(blocks.length, `no "${subject}" email for QA user`)
  return blocks
    .at(first ? 0 : -1)
    .match(/href="([^"]+)"/)[1]
    .replaceAll("&amp;", "&")
}
async function emailCount(email, subject) {
  const log = await fs.readFile(process.env.QA_SERVER_LOG, "utf8")
  return log.split("[email] (dev, not sent)").filter(b => b.includes(`to=${email}`) && b.includes(subject))
    .length
}
async function loginUi(email, password, stay = false) {
  if (stay) await wait("document.querySelector('#login-email')")
  else await navigate("/login", "document.querySelector('#login-email')")
  await fill("#login-email", email)
  await fill("#login-password", password)
  await click(button("Войти"))
}
async function logoutUi() {
  await click("document.querySelector('[aria-label=\"Настройки\"]')")
  await click(button("Выйти"))
  await wait("location.pathname === '/login'")
  assert.equal(await session(), null, "session gone after logout")
}

try {
  await send("Network.enable")
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await send("Network.clearBrowserCookies")
  await navigate("/login", "document.querySelector('#login-email')")
  await evaluate("localStorage.setItem('mytracker-language','ru')")

  let login
  if (mode === "local") {
    login = {
      email: `independence-${crypto.randomUUID()}@example.invalid`,
      password: `Qa1-${crypto.randomUUID()}`,
    }
    await fs.writeFile(credentials, JSON.stringify(login), { mode: 0o600 })

    await navigate("/register", "document.querySelector('#register-email')")
    await fill("#register-name", "Auth QA")
    await fill("#register-email", login.email)
    await fill("#register-password", login.password)
    await click(button("Зарегистрироваться"))
    await wait(text("Проверьте почту"))
    assert.equal(await emailCount(login.email, "подтвердите почту"), 1)
    ok("Registration: form accepted, verification email generated")

    await loginUi(login.email, login.password)
    await wait(text("Подтвердите почту перед входом."))
    assert.equal(await session(), null)
    for (let i = 0; i < 25 && (await emailCount(login.email, "подтвердите почту")) < 2; i++) await pause(200)
    assert.equal(await emailCount(login.email, "подтвердите почту"), 2, "sendOnSignIn re-sends the link")
    ok("Login before verification refused, fresh link re-sent")

    // Both links — from sign-up and the one re-sent on sign-in — must land on
    // /login?verified=1 (server rewrites the re-sent one, auth.ts). Open the
    // re-sent one, the path that used to lose the welcome dialog.
    const callback = link => new URL(link).searchParams.get("callbackURL")
    assert.equal(
      callback(await emailLink(login.email, "подтвердите почту", true)),
      origin + "/login?verified=1",
    )
    assert.equal(callback(await emailLink(login.email, "подтвердите почту")), "/login?verified=1")
    const verify = await emailLink(login.email, "подтвердите почту")
    assert(
      verify.startsWith(origin + "/api/auth/verify-email?token="),
      "verification link points at this site",
    )
    await send("Page.navigate", { url: verify })
    await wait("location.pathname === '/login'")
    assert.equal(await path(), "/login?verified=1")
    ok("Verification link opens and lands on /login?verified=1")

    await loginUi(login.email, login.password, true)
    await wait("location.pathname === '/today'")
    assert.equal(await path(), "/today?firstLogin=1")
    assert.equal((await session()).user.email, login.email)
    await wait(text("Добро пожаловать в MyTracker!"))
    await click(button("Начать"))
    await wait("!document.querySelector('[role=dialog]')")
    ok("First login after verification → Today, welcome dialog shown and closed")

    await logoutUi()
    ok("Logout via Settings → /login, session cleared")

    await loginUi(login.email, "Wrong-password-1")
    await wait(text("Не удалось войти. Проверьте почту и пароль."))
    assert.equal(await session(), null)
    ok("Wrong password shows an error, no session")

    await navigate("/forgot-password", "document.querySelector('#forgot-email')")
    await fill("#forgot-email", login.email)
    await click(button("Отправить ссылку"))
    await wait(text("Проверьте почту"))
    for (let i = 0; i < 25 && !(await emailCount(login.email, "Восстановление пароля")); i++) await pause(200)
    const reset = await emailLink(login.email, "Восстановление пароля")
    assert(reset.startsWith(origin + "/api/auth/reset-password/"), "reset link points at this site")
    ok("Forgot password: email with reset link generated")

    await send("Page.navigate", { url: reset })
    await wait("location.pathname === '/reset-password' && document.querySelector('#reset-password')")
    assert(new URL(await evaluate("location.href")).searchParams.get("token"))
    await fill("#reset-password", "onlyletters")
    await click(button("Сохранить пароль"))
    await pause(800)
    assert.equal(await evaluate("location.pathname"), "/reset-password", "weak password not accepted")
    // Server-side rule too (hook in auth.ts), not only the client check.
    const weak = await evaluate(
      `fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({newPassword:'onlyletters',token:new URL(location.href).searchParams.get('token')})}).then(r=>r.status)`,
    )
    assert.equal(weak, 400)
    const newPassword = `Qa2-${crypto.randomUUID()}`
    await fill("#reset-password", newPassword)
    await click(button("Сохранить пароль"))
    await wait("location.pathname === '/login'")
    ok("Reset: weak password rejected (UI + server), same link then sets a new one")

    const reused = await evaluate(
      `fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({newPassword:'Another-pass-3',token:${JSON.stringify(new URL(await emailLink(login.email, "Восстановление пароля")).pathname.split("/").at(-1))}})}).then(r=>r.status)`,
    )
    assert.equal(reused, 400, "used reset link must not work twice")
    ok("Used reset link is rejected")

    await loginUi(login.email, login.password)
    await wait(text("Не удалось войти. Проверьте почту и пароль."))
    await loginUi(login.email, newPassword)
    await wait("location.pathname === '/today'")
    assert.equal(await path(), "/today?welcomeBack=1")
    ok("Old password refused, new password logs in")
    login.password = newPassword
    await fs.writeFile(credentials, JSON.stringify(login), { mode: 0o600 })
  } else {
    login = JSON.parse(await fs.readFile(credentials, "utf8"))
    assert(/^independence-[a-f0-9-]+@example.invalid$/.test(login.email), "Disposable QA credentials only")
    await loginUi(login.email, login.password)
    await wait("location.pathname === '/today'")
    assert.equal((await session()).user.email, login.email)
    ok("Login via form → Today")
  }

  const { cookies } = await send("Network.getCookies", { urls: [origin] })
  const auth = cookies.filter(c => c.name.includes("session_token"))
  assert.equal(auth.length, 1, "one session cookie")
  const [c] = auth
  assert(c.httpOnly, "httpOnly")
  assert.equal(c.sameSite, "Lax")
  assert.equal(c.path, "/")
  if (mode === "staging") {
    assert(c.secure, "Secure on https")
    assert(c.name.startsWith("__Secure-mytracker-staging."), "staging cookie prefix: " + c.name)
  }
  ok(`Session cookie ${c.name}: HttpOnly, SameSite=Lax${c.secure ? ", Secure" : ""}`)

  await send("Page.reload")
  await pause(800)
  await wait("location.pathname === '/today' && document.body.innerText.includes('Заметки')")
  ok("Session survives a page reload")

  for (const [route, check] of [
    ["/tasks", "location.pathname === '/tasks'"],
    ["/goals?goal=00000000-0000-0000-0000-000000000000", "location.pathname === '/goals'"],
    ["/habits", "location.pathname === '/habits'"],
    ["/calendar?view=week", "location.pathname === '/calendar'"],
    ["/no-such-page", "location.pathname === '/today'"],
  ]) {
    await navigate(route, check)
  }
  for (const label of ["Задачи", "Цели", "Привычки", "Календарь", "Сегодня"]) {
    await click(
      `[...document.querySelectorAll('a')].find(a=>a.textContent.trim()===${JSON.stringify(label)})`,
    )
    await pause(300)
  }
  assert.equal(await evaluate("location.pathname"), "/today")
  ok("Navigation: direct URLs with query params, unknown route → Today, sidebar links")

  await logoutUi()
  await navigate("/goals", "location.pathname === '/login'")
  ok("Logout; protected page then redirects to /login")

  if (mode === "staging") {
    // Production-only limiter (5 sign-ins per 60 s per IP in auth.ts).
    const statuses = []
    for (let i = 0; i < 7; i++)
      statuses.push(
        await evaluate(
          `fetch('/api/auth/sign-in/email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:${JSON.stringify(login.email)},password:'Wrong-password-1'})}).then(r=>r.status+':'+(r.headers.get('content-type')||''))`,
        ),
      )
    assert(
      statuses.some(s => s.startsWith("429") && s.includes("json")),
      statuses.join(" "),
    )
    await loginUi(login.email, login.password)
    await wait("document.querySelector('[role=alert], .text-destructive')")
    assert.equal(await evaluate("location.pathname"), "/login")
    ok(`Rate limit: 429 with JSON after repeated attempts, UI shows an error (${statuses.join(" ")})`)
  }

  assert.deepEqual(errors, [], "no JS errors")
  ok("No JavaScript errors")
  await fs.writeFile(
    qaFile(`mytracker-auth-${mode}-results.json`),
    JSON.stringify({ passed: results }, null, 2),
  )
  console.log(JSON.stringify({ mode, passed: results.length, errors: 0 }))
} finally {
  close()
}

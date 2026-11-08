import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import assert from "node:assert/strict"
// Scratch folder for credentials, screenshots and results — never inside
// Git. Keeps the original Mac location; other systems (the owner's Windows
// PC) use the OS temp folder. QA_TMP overrides both.
export const qaTmp = process.env.QA_TMP ?? (process.platform === "darwin" ? "/private/tmp" : os.tmpdir())
export const qaFile = name => path.join(qaTmp, name)
export const origin = process.env.QA_ORIGIN ?? "http://localhost:3002"
assert(["http://localhost:3002", "https://test.mytracker.space"].includes(origin), "QA origin only")
const pages = await (await fetch("http://127.0.0.1:9222/json/list")).json()
const ws = new WebSocket(pages.find(page => page.type === "page").webSocketDebuggerUrl)
await new Promise(resolve => ws.addEventListener("open", resolve, { once: true }))
let sequence = 0
const pending = new Map()
export const errors = []
ws.addEventListener("message", event => {
  const message = JSON.parse(event.data)
  if (message.id) {
    const call = pending.get(message.id)
    if (call) {
      pending.delete(message.id)
      clearTimeout(call.timer)
      message.error ? call.reject(new Error(JSON.stringify(message.error))) : call.resolve(message.result)
    }
  }
  if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text)
})
export function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(new Error("CDP timeout: " + method))
    }, 45000)
    pending.set(id, { resolve, reject, timer })
    ws.send(JSON.stringify({ id, method, params }))
  })
}
export async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails)
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
  return result.result.value
}
export const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
export async function wait(expression) {
  for (let i = 0; i < 150; i++) {
    if (await evaluate(`Boolean(${expression})`)) return
    await pause(200)
  }
  throw new Error("Timeout: " + expression)
}
export const button = text =>
  `[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)})`
export async function point(expression) {
  return evaluate(
    `(()=>{const r=(${expression}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`,
  )
}
export async function click(expression) {
  await wait(expression)
  await evaluate(`(${expression}).scrollIntoView({block:'center'})`)
  await pause(100)
  const p = await point(expression)
  await send("Input.dispatchMouseEvent", { type: "mousePressed", ...p, button: "left", clickCount: 1 })
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...p, button: "left", clickCount: 1 })
  await pause(150)
}
export async function fill(selector, value) {
  await wait(`document.querySelector(${JSON.stringify(selector)})`)
  await evaluate(
    `(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`,
  )
}
export async function navigate(path, ready) {
  await send("Page.navigate", { url: origin + path })
  await wait(ready)
  await pause(250)
}
export async function api(path, method = "GET", body) {
  return evaluate(
    `(async()=>{const response=await fetch('/api/'+${JSON.stringify(path)},{method:${JSON.stringify(method)},headers:{'Content-Type':'application/json'},${body === undefined ? "" : `body:JSON.stringify(${JSON.stringify(body)}),`}});if(!response.ok)throw new Error('API '+response.status+' '+${JSON.stringify(path)});return response.status===204?null:response.json()})()`,
  )
}
export async function saved(test) {
  for (let i = 0; i < 100; i++) {
    if (await test()) return
    await pause(150)
  }
  throw new Error("Save timeout")
}
export async function screenshot(name) {
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false })
  await fs.writeFile(qaFile(`mytracker-qa-${name}.png`), Buffer.from(r.data, "base64"))
}
export function close() {
  ws.close()
  for (const call of pending.values()) clearTimeout(call.timer)
}
export async function drag(from, to, touch = false) {
  await evaluate(`(${from}).scrollIntoView({block:'center'})`)
  await pause(150)
  const a = await point(from),
    b = typeof to === "string" ? await point(to) : to
  if (touch) {
    await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 })
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...a, id: 1 }] })
    await pause(350)
  } else {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...a })
    await send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      ...a,
      button: "left",
      buttons: 1,
      clickCount: 1,
    })
  }
  for (let i = 1; i <= 18; i++) {
    const p = { x: a.x + ((b.x - a.x) * i) / 18, y: a.y + ((b.y - a.y) * i) / 18 }
    await send(
      touch ? "Input.dispatchTouchEvent" : "Input.dispatchMouseEvent",
      touch
        ? { type: "touchMove", touchPoints: [{ ...p, id: 1 }] }
        : { type: "mouseMoved", ...p, button: "left", buttons: 1 },
    )
    await pause(30)
  }
  if (touch) await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  else
    await send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      ...b,
      button: "left",
      buttons: 0,
      clickCount: 1,
    })
  await pause(350)
}
await send("Runtime.enable")
await send("Page.enable")

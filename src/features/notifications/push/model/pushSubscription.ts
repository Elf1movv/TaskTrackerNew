import { isStandalone } from "@/shared/lib/pwa"
import { deleteSubscription, fetchPublicKey, saveSubscription } from "../api/pushApi"

// The browser side of push notifications (2026-11-12): ask for permission,
// subscribe at the browser's push service with our server's public key, and
// hand the subscription to our server (lib/push on the server sends to it).

export type PushStatus =
  | "loading"
  | "unsupported" // this browser has no push at all
  | "needs-install" // iPhone/iPad: push works only in the installed app
  | "unavailable" // the server has no keys (push not set up)
  | "denied" // the person blocked notifications for the site
  | "off"
  | "on"

// Several places show the status (settings, the offer on Today); a change
// made in one is announced so the others update without a reload.
const STATUS_EVENT = "mytracker-push-status"
export function announcePushStatus(status: PushStatus) {
  window.dispatchEvent(new CustomEvent<PushStatus>(STATUS_EVENT, { detail: status }))
}
export function onPushStatus(listener: (status: PushStatus) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<PushStatus>).detail)
  window.addEventListener(STATUS_EVENT, handler)
  return () => window.removeEventListener(STATUS_EVENT, handler)
}

const isIos = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1)

export function pushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
}

const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

// The key arrives as base64url text; the browser wants raw bytes.
function keyBytes(base64url: string): ArrayBuffer {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/")
  const raw = atob(base64)
  const buffer = new ArrayBuffer(raw.length)
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return buffer
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

function toBody(subscription: PushSubscription, language: "ru" | "en") {
  const json = subscription.toJSON()
  return {
    endpoint: subscription.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
    timeZone: timeZone(),
    language,
  }
}

export async function readPushStatus(): Promise<PushStatus> {
  // Without a registered service worker (e.g. `npm run dev`) nothing works.
  if (!pushSupported() || !navigator.serviceWorker.controller) {
    return isIos() && !isStandalone() ? "needs-install" : "unsupported"
  }
  if (isIos() && !isStandalone()) return "needs-install"
  if ((await fetchPublicKey()) === null) return "unavailable"
  if (Notification.permission === "denied") return "denied"
  const subscription = Notification.permission === "granted" ? await currentSubscription() : null
  return subscription ? "on" : "off"
}

// Must be called from a tap/click: browsers only show the permission
// question in direct answer to the person's action.
export async function enablePush(language: "ru" | "en"): Promise<PushStatus> {
  const permission = await Notification.requestPermission()
  if (permission === "denied") return "denied"
  if (permission !== "granted") return "off"
  const publicKey = await fetchPublicKey()
  if (!publicKey) return "unavailable"
  const registration = await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(publicKey),
    }))
  await saveSubscription(toBody(subscription, language))
  return "on"
}

export async function disablePush(): Promise<PushStatus> {
  const subscription = await currentSubscription()
  if (subscription) {
    await deleteSubscription(subscription.endpoint).catch(err => console.error(err))
    await subscription.unsubscribe()
  }
  return "off"
}

// On every visit: re-send an existing subscription so the server has the
// current time zone (trips), language and account. Silent on failure.
export async function syncPush(language: "ru" | "en"): Promise<void> {
  if (!pushSupported() || !navigator.serviceWorker.controller) return
  if (Notification.permission !== "granted") return
  const subscription = await currentSubscription()
  if (subscription) await saveSubscription(toBody(subscription, language))
}

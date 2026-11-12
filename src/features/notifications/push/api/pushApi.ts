// Talks to server/src/routes/push.ts and the notification part of routes/me.ts.

export interface NotificationSettings {
  notifyTime: string
  notifyDigest: boolean
  timeZone: string | null
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  })
  if (!res.ok)
    throw Object.assign(new Error(`${init?.method ?? "GET"} /api/${path} failed: ${res.status}`), {
      status: res.status,
    })
  return (res.status === 204 ? null : await res.json()) as T
}

// null = push isn't set up on this server (no keys) — the UI says so.
export async function fetchPublicKey(): Promise<string | null> {
  try {
    return (await call<{ publicKey: string }>("push/key")).publicKey
  } catch (err) {
    if ((err as { status?: number }).status === 503) return null
    throw err
  }
}

export const saveSubscription = (body: {
  endpoint: string
  keys: { p256dh: string; auth: string }
  timeZone: string
  language: "ru" | "en"
}) => call<{ ok: true }>("push/subscriptions", { method: "POST", body: JSON.stringify(body) })

export const deleteSubscription = (endpoint: string) =>
  call<null>("push/subscriptions", { method: "DELETE", body: JSON.stringify({ endpoint }) })

export const sendTestPush = () =>
  call<{ result: "delivered" | "gone" | "failed" }>("push/test", { method: "POST" })

export const fetchNotificationSettings = () => call<NotificationSettings>("me/notifications")

export const saveNotificationSettings = (patch: Partial<NotificationSettings>) =>
  call<NotificationSettings>("me/notifications", { method: "PUT", body: JSON.stringify(patch) })

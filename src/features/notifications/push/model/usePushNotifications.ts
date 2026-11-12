import { useCallback, useEffect, useState } from "react"
import { useLanguage } from "@/shared/lib/i18n"
import {
  announcePushStatus,
  disablePush,
  enablePush,
  onPushStatus,
  readPushStatus,
  syncPush,
  type PushStatus,
} from "./pushSubscription"

export function usePushNotifications() {
  const { language } = useLanguage()
  const [status, setStatus] = useState<PushStatus>("loading")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    readPushStatus()
      .then(next => !cancelled && setStatus(next))
      .catch(err => {
        console.error(err)
        if (!cancelled) setStatus("unavailable")
      })
    const unsubscribe = onPushStatus(setStatus)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const run = useCallback(async (action: () => Promise<PushStatus>) => {
    setBusy(true)
    try {
      const next = await action()
      setStatus(next)
      announcePushStatus(next)
      return true
    } catch (err) {
      console.error(err)
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const enable = useCallback(() => run(() => enablePush(language)), [run, language])
  const disable = useCallback(() => run(disablePush), [run])

  return { status, busy, enable, disable }
}

// Mounted once (app/layouts/RootLayout): keeps the server's copy of this
// browser's subscription current — time zone, language, account.
export function usePushSync(userId: string | undefined) {
  const { language } = useLanguage()
  useEffect(() => {
    if (userId) syncPush(language).catch(err => console.error(err))
  }, [userId, language])
}

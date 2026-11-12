import { useEffect, useState } from "react"
import { Bell, BellOff, Send } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"
import {
  fetchNotificationSettings,
  saveNotificationSettings,
  sendTestPush,
  type NotificationSettings,
} from "../api/pushApi"
import { usePushNotifications } from "../model/usePushNotifications"

// Settings → "Notifications" (2026-11-12): on/off, the morning time (untimed
// reminders and the digest), the digest itself, and a test notification.
export function NotificationsSection() {
  const { t } = useLanguage()
  const { status, busy, enable, disable } = usePushNotifications()
  const [settings, setSettings] = useState<NotificationSettings | null>(null)

  useEffect(() => {
    if (status !== "on") return
    fetchNotificationSettings()
      .then(setSettings)
      .catch(err => console.error(err))
  }, [status])

  async function save(patch: Partial<NotificationSettings>) {
    if (!settings) return
    const previous = settings
    setSettings({ ...settings, ...patch })
    try {
      setSettings(await saveNotificationSettings(patch))
    } catch (err) {
      console.error(err)
      setSettings(previous)
      toast.error(t("push.saveFailed"))
    }
  }

  async function test() {
    try {
      const { result } = await sendTestPush()
      if (result === "delivered") toast.success(t("push.testSent"))
      else toast.error(t("push.testFailed"))
    } catch (err) {
      console.error(err)
      toast.error(t("push.testFailed"))
    }
  }

  if (status === "loading") return null

  const note = (key: Parameters<typeof t>[0]) => <p className="text-meta text-muted-foreground">{t(key)}</p>

  return (
    <div className="space-y-5">
      <p className="text-meta text-muted-foreground">{t("push.description")}</p>

      {status === "unsupported" && note("push.unsupported")}
      {status === "needs-install" && note("push.needsInstall")}
      {status === "unavailable" && note("push.unavailable")}
      {status === "denied" && note("push.denied")}

      {(status === "on" || status === "off") && (
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            value={status}
            disabled={busy}
            onValueChange={async v => {
              if (v === "on" && status !== "on") {
                const ok = await enable()
                if (!ok) toast.error(t("push.enableFailed"))
              }
              if (v === "off" && status !== "off") await disable()
            }}
            className="w-full"
          >
            <ToggleGroupItem value="off" className="flex-1">
              <BellOff size={14} />
              {t("push.off")}
            </ToggleGroupItem>
            <ToggleGroupItem value="on" className="flex-1">
              <Bell size={14} />
              {t("push.on")}
            </ToggleGroupItem>
          </ToggleGroup>

          {status === "on" && settings && (
            <div className="space-y-4">
              <label className="flex flex-col gap-2">
                <span className="text-meta font-semibold text-tertiary">{t("push.morningTime")}</span>
                <Input
                  type="time"
                  value={settings.notifyTime}
                  onChange={e => e.target.value && save({ notifyTime: e.target.value })}
                  className="h-10 w-32 rounded-md bg-sunken"
                />
                <span className="text-meta text-muted-foreground">{t("push.morningTimeHint")}</span>
              </label>
              <label className="flex items-center gap-2.5 text-sm">
                <Checkbox
                  checked={settings.notifyDigest}
                  onCheckedChange={checked => save({ notifyDigest: checked === true })}
                />
                {t("push.digest")}
              </label>
              <Button variant="outline" className="w-full justify-center" onClick={test}>
                <Send size={14} />
                {t("push.test")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

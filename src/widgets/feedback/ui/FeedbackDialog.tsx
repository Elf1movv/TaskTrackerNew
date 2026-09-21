import { useRef, useState } from "react"
import { Paperclip, X } from "lucide-react"
import { toast } from "sonner"
import { useLocation } from "react-router"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Textarea } from "@/shared/ui/textarea"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { t } = useLanguage()
  const location = useLocation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState("")
  const [imageData, setImageData] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function reset() {
    setMessage("")
    setImageData(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t("feedback.imageTooLarge"))
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImageData(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    if (!message.trim()) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          imageData: imageData ?? undefined,
          page: location.pathname,
        }),
      })
      if (!res.ok) throw new Error(`Failed to submit feedback: ${res.status}`)
      toast.success(t("feedback.successToast"))
      reset()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error(t("feedback.errorToast"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("feedback.dialogTitle")}</DialogTitle>
          {/* sr-only — the visible textarea placeholder already says this
              on screen; Radix requires an accessible description for
              screen readers regardless. */}
          <DialogDescription className="sr-only">{t("feedback.messagePlaceholder")}</DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          rows={5}
          placeholder={t("feedback.messagePlaceholder")}
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
        {imageData ? (
          <div className="relative w-fit">
            <img src={imageData} alt="" className="max-h-32 rounded-md border border-border" />
            <button
              type="button"
              onClick={() => setImageData(null)}
              className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-fit">
            <Paperclip size={13} />
            {t("feedback.attachScreenshot")}
          </Button>
        )}
        <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting || !message.trim()}>
          {t("feedback.submit")}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

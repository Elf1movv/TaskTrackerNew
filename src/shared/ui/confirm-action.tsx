import { useState, type ReactNode } from "react"
import { useLanguage } from "@/shared/lib/i18n"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog"
import { buttonVariants } from "./button"

// The one confirmation window for deleting anything (audit П10, decision 8):
// the confirm button is always red and reads "Удалить" unless told otherwise.
// Two ways to open it:
// - wrap the trigger button as `children` (it opens on click), or
// - control it with `open` / `onOpenChange` when something else decides
//   (e.g. "Delete" inside the category settings popover).
// Clicks inside the window never reach the row behind it: the window is
// portaled, but React still bubbles its events to the parent component, and
// several rows toggle on click (a habit card marks it done).
export function ConfirmAction({
  children,
  title,
  description,
  confirmLabel,
  onConfirm,
  open: controlledOpen,
  onOpenChange,
}: {
  children?: ReactNode
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const { t } = useLanguage()
  const [ownOpen, setOwnOpen] = useState(false)
  const open = controlledOpen ?? ownOpen
  const setOpen = onOpenChange ?? setOwnOpen
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
      <AlertDialogContent onClick={e => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={buttonVariants({ variant: "destructive" })}>
            {confirmLabel ?? t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

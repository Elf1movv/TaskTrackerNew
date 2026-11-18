import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface SendEmailInput {
  to: string
  subject: string
  html: string
  // Resend accepts attachment content as a base64 string, exactly the
  // format the feedback form already uploads screenshots in — no
  // encoding/decoding step needed between the two.
  attachments?: { filename: string; content: string }[]
}

// In development/tests, there's no real inbox to check and no reason to
// spend real Resend sends — the link just goes to the console instead, so
// the auth flow (email verification, password reset) stays fully testable
// without any email infrastructure locally.
const EMAIL_TIMEOUT_MS = 10_000

export async function sendEmail({ to, subject, html, attachments }: SendEmailInput): Promise<void> {
  if (process.env.EMAIL_DELIVERY === "disabled") return
  if (!resend) {
    console.log(
      `[email] (dev, not sent) to=${to} subject="${subject}" attachments=${attachments?.length ?? 0}\n${html}`,
    )
    return
  }

  // At most 10 s: a stuck mail service must not keep the person waiting on
  // the sign-up screen (speed iteration 2026-11-18). The send itself can't be
  // cancelled; we only stop waiting and log it.
  const send = resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "MyTracker <onboarding@resend.dev>",
    to,
    subject,
    html,
    attachments,
  })
  const timeout = new Promise<"timeout">(resolve =>
    setTimeout(() => resolve("timeout"), EMAIL_TIMEOUT_MS).unref(),
  )
  const result = await Promise.race([send, timeout])
  if (result === "timeout") {
    console.error(`Email to Resend took over ${EMAIL_TIMEOUT_MS} ms, stopped waiting`)
    return
  }
  const { error } = result
  if (error) {
    console.error("Failed to send email via Resend:", error)
  }
}

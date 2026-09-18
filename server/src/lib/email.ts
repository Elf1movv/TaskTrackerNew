import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface SendEmailInput {
  to: string
  subject: string
  html: string
}

// In development/tests, there's no real inbox to check and no reason to
// spend real Resend sends — the link just goes to the console instead, so
// the auth flow (email verification, password reset) stays fully testable
// without any email infrastructure locally.
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  if (!resend) {
    console.log(`[email] (dev, not sent) to=${to} subject="${subject}"\n${html}`)
    return
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "MyTracker <onboarding@resend.dev>",
    to,
    subject,
    html,
  })
  if (error) {
    console.error("Failed to send email via Resend:", error)
  }
}

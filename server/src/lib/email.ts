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
export async function sendEmail({ to, subject, html, attachments }: SendEmailInput): Promise<void> {
  if (!resend) {
    console.log(
      `[email] (dev, not sent) to=${to} subject="${subject}" attachments=${attachments?.length ?? 0}\n${html}`,
    )
    return
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "MyTracker <onboarding@resend.dev>",
    to,
    subject,
    html,
    attachments,
  })
  if (error) {
    console.error("Failed to send email via Resend:", error)
  }
}

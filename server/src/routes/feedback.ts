import { Router } from "express"
import { db } from "../db.js"
import { sendEmail } from "../lib/email.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { createFeedbackSchema } from "../validation/feedback.js"

export const feedbackRouter = Router()

feedbackRouter.use(requireAuth)

feedbackRouter.post("/", async (req, res) => {
  const parsed = createFeedbackSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid feedback", details: parsed.error.flatten() })
    return
  }

  const created = await db.feedback.create({ data: { ...parsed.data, userId: req.userId } })
  res.status(201).json({ id: created.id })

  // Fire-and-forget: the feedback is already saved, so a slow or failing
  // email must never affect the response the user sees. No recipient
  // inbox exists yet (see LEARNING.md) — until FEEDBACK_EMAIL_TO is set,
  // this just logs like every other email in dev.
  const to = process.env.FEEDBACK_EMAIL_TO
  if (!to) {
    console.log(`[feedback] (no FEEDBACK_EMAIL_TO set) from user=${req.userId}: ${parsed.data.message}`)
    return
  }

  const imageData = parsed.data.imageData
  const base64Content = imageData?.includes(",") ? imageData.split(",")[1] : imageData

  void (async () => {
    // The form itself has no name/email field — feedback is
    // authenticated-only, so the submitter's account already has both;
    // looking it up here beats asking them to type it in every time.
    const user = await db.user.findUnique({ where: { id: req.userId }, select: { name: true, email: true } })
    const from = user ? `${user.name} (${user.email})` : req.userId

    // A "[Bug]"/"[Suggestion]" subject tag, not just a body field, so the
    // two can be told apart at a glance in an inbox list and filtered by
    // subject text without opening each email.
    const typeLabel = parsed.data.type === "bug" ? "Bug" : "Suggestion"

    await sendEmail({
      to,
      subject: `MyTracker — [${typeLabel}] new feedback`,
      html: `
        <p><strong>Type:</strong> ${typeLabel}</p>
        <p><strong>From:</strong> ${from}</p>
        <p><strong>Page:</strong> ${parsed.data.page ?? "unknown"}</p>
        <p><strong>Message:</strong></p>
        <p>${parsed.data.message}</p>
      `,
      attachments: base64Content ? [{ filename: "screenshot.png", content: base64Content }] : undefined,
    })
  })()
})

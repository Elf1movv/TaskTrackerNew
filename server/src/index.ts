import { createApp } from "./app.js"
import { startPushScheduler } from "./lib/push/scheduler.js"

const port = process.env.PORT ?? 3001

createApp().listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
  // Push notifications: a once-a-minute check (off without VAPID keys).
  startPushScheduler()
})

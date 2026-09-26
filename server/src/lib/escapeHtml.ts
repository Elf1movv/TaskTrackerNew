// Escapes the 5 characters that matter for inserting untrusted text into
// an HTML document — used wherever user-controlled data (feedback
// message, a user's display name, etc.) gets interpolated into an email
// template literal, since those are built as plain strings with no
// templating engine to do this automatically.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

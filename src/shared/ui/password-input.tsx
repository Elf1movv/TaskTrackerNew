import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "./utils"
import { Input } from "./input"

// Input + a trailing eye toggle — switches its own `type` between
// "password"/"text" to reveal what's currently being typed. Never reveals
// a stored password (the server never sends one back to reveal).
export function PasswordInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-9", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

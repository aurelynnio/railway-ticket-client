import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg bg-surface-2 px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-ink-subtle transition-colors duration-200",
        "hover:bg-surface-3",
        "focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-ring/60",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
        "aria-invalid:bg-destructive-soft aria-invalid:ring-2 aria-invalid:ring-destructive/50",
        className
      )}
      {...props}
    />
  )
}

export { Input }

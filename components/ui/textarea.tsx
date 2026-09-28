import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full rounded-lg bg-surface-2 px-4 py-3 text-sm text-foreground outline-none placeholder:text-ink-subtle transition-colors duration-200",
        "hover:bg-surface-3",
        "focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-ring/60",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
        "aria-invalid:bg-destructive-soft aria-invalid:ring-2 aria-invalid:ring-destructive/50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };

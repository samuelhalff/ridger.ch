import * as React from "react";

import { cn } from "@/src/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 flex field-sizing-content min-h-16 w-full rounded-md bg-surface-warm px-3 py-2 text-base shadow-[inset_0_0_0_1px_rgba(20,16,14,0.06),0_1px_2px_rgba(20,16,14,0.04)] transition-[background-color,color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-card dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.22)]",
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };

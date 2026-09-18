import * as React from "react";

import { cn } from "@/src/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:selection:bg-primary selection:text-primary-foreground flex h-10 w-full min-w-0 rounded-md bg-surface-warm px-3 py-1 text-base shadow-[inset_0_0_0_1px_rgba(20,16,14,0.06),0_1px_2px_rgba(20,16,14,0.04)] transition-[background-color,color,box-shadow] outline-none file:inline-flex file:h-7 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-card dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.22)]",
          "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };

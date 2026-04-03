"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[140px] w-full rounded-3xl border border-neutral-200 bg-white px-4 py-3.5 text-sm text-neutral-950 shadow-[0_1px_0_rgba(17,24,39,0.02)] transition-all duration-200 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 focus:scale-[1.01] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-700 dark:focus:ring-white/10",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";

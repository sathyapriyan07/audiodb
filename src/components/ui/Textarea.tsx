import React from "react";
import { cn } from "@/utils/cn";

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      className={cn(
        "focus-ring min-h-24 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm placeholder:text-[rgb(var(--muted))]",
        className,
      )}
      {...rest}
    />
  );
}

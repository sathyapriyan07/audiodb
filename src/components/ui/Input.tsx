import React from "react";
import { cn } from "@/utils/cn";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={cn(
        "focus-ring h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm placeholder:text-[rgb(var(--muted))]",
        className,
      )}
      {...rest}
    />
  );
}

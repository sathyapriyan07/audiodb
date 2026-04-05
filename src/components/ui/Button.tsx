import React from "react";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const base =
  "focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[rgb(var(--fg))] text-[rgb(var(--bg))] hover:opacity-90 dark:bg-white dark:text-slate-900",
  secondary:
    "bg-[rgb(var(--card))] text-[rgb(var(--fg))] border border-[rgb(var(--border))] hover:bg-black/5 dark:hover:bg-white/5",
  ghost: "text-[rgb(var(--fg))] hover:bg-black/5 dark:hover:bg-white/5",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  },
) {
  const { className, variant = "secondary", size = "md", ...rest } = props;
  return <button className={cn(base, variants[variant], sizes[size], className)} {...rest} />;
}

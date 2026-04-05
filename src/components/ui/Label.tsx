import React from "react";
import { cn } from "@/utils/cn";

export function Label(
  props: React.LabelHTMLAttributes<HTMLLabelElement> & { hint?: string },
) {
  const { className, hint, children, ...rest } = props;
  return (
    <label className={cn("text-sm font-medium", className)} {...rest}>
      <span>{children}</span>
      {hint ? <span className="ml-2 text-xs font-normal text-[rgb(var(--muted))]">{hint}</span> : null}
    </label>
  );
}

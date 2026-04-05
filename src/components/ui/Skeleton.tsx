import React from "react";
import { cn } from "@/utils/cn";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-black/10 dark:bg-white/10", className)}
      {...props}
    />
  );
}

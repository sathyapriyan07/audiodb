import React from "react";

import { cn } from "@/utils/cn";

export function RowSection({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-[rgb(var(--muted))]">{subtitle}</p> : null}
        </div>
      </div>
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
        <div className="flex min-w-max snap-x snap-mandatory gap-4">
          <div className="contents [&>*]:snap-start">{children}</div>
        </div>
      </div>
    </section>
  );
}

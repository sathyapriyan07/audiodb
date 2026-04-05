import React from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";

export function AdminHeader({
  title,
  subtitle,
  actionHref,
  actionLabel,
  actions,
}: {
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[rgb(var(--muted))]">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {actionHref && actionLabel ? (
          <Link to={actionHref}>
            <Button variant="primary">{actionLabel}</Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}


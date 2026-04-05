import { cn } from "@/utils/cn";

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))]", className)}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[rgb(var(--border))] border-t-[rgb(var(--fg))]" />
      {label ? <span>{label}</span> : null}
    </div>
  );
}

export function FullScreenSpinner({ label }: { label?: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Spinner label={label ?? "Loading"} />
    </div>
  );
}

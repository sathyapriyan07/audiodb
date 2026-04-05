import { useFieldArray } from "react-hook-form";
import { Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { PlatformRow } from "@/services/music/platforms";

export type StreamingLinkInput = { platform_id: string; url: string };

export function StreamingLinksEditor({
  control,
  name,
  platforms,
  label = "Streaming links",
}: {
  control: any;
  name: string;
  platforms: PlatformRow[];
  label?: string;
}) {
  const { fields, append, remove, update } = useFieldArray({ control, name });

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <Label>{label}</Label>
        <Button
          type="button"
          size="sm"
          onClick={() => append({ platform_id: platforms[0]?.id ?? "", url: "" } as any)}
        >
          <Plus className="h-4 w-4" />
          Add link
        </Button>
      </div>

      <div className="space-y-2">
        {fields.length ? (
          fields.map((f, idx) => (
            <div key={f.id} className="grid gap-2 md:grid-cols-[220px_1fr_auto] md:items-center">
              <select
                className="focus-ring h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm"
                value={(f as any).platform_id}
                onChange={(e) => update(idx, { ...(f as any), platform_id: e.target.value })}
              >
                <option value="" disabled>
                  Select platform…
                </option>
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Input
                value={(f as any).url ?? ""}
                onChange={(e) => update(idx, { ...(f as any), url: e.target.value })}
                placeholder="https://…"
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)} aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-sm text-[rgb(var(--muted))]">No links added.</div>
        )}
      </div>
    </div>
  );
}

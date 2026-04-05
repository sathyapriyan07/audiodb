import { useFieldArray } from "react-hook-form";
import { Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { ArtistRow } from "@/services/music/artists";

export type SongArtistInput = { artist_id: string; role: string | null };

export function ArtistRolesEditor({
  control,
  name,
  artists,
  label = "Artists",
}: {
  control: any;
  name: string;
  artists: ArtistRow[];
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
          onClick={() => append({ artist_id: artists[0]?.id ?? "", role: "Primary" } as any)}
        >
          <Plus className="h-4 w-4" />
          Add artist
        </Button>
      </div>

      <div className="space-y-2">
        {fields.length ? (
          fields.map((f, idx) => (
            <div key={f.id} className="grid gap-2 md:grid-cols-[1fr_220px_auto] md:items-center">
              <select
                className="focus-ring h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm"
                value={(f as any).artist_id}
                onChange={(e) => update(idx, { ...(f as any), artist_id: e.target.value })}
              >
                <option value="" disabled>
                  Select artist…
                </option>
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <Input
                value={(f as any).role ?? ""}
                onChange={(e) => update(idx, { ...(f as any), role: e.target.value })}
                placeholder="Role (Primary, Featuring, Producer…)"
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)} aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-sm text-[rgb(var(--muted))]">No artists assigned.</div>
        )}
      </div>
    </div>
  );
}

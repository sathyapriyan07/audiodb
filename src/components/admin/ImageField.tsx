import React from "react";
import { useController } from "react-hook-form";

import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { ResolvedImage } from "@/components/ResolvedImage";
import { uploadImageFile } from "@/services/images/uploadImage";
import type { ImageRef } from "@/types/media";
import { toErrorMessage } from "@/services/db/errors";

export function ImageField({
  control,
  name,
  label,
  folder,
}: {
  control: any;
  name: string;
  label: string;
  folder: string;
}) {
  const { field } = useController({ control, name });
  const value = (field.value ?? null) as ImageRef | null;
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const source = value?.source ?? "url";

  const setSource = (next: "url" | "upload") => {
    field.onChange({ ...(value ?? {}), source: next });
  };

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsUploading(true);
    try {
      const img = await uploadImageFile(file, { folder });
      field.onChange(img);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={source === "url" ? "primary" : "secondary"}
          onClick={() => setSource("url")}
        >
          External URL
        </Button>
        <Button
          type="button"
          size="sm"
          variant={source === "upload" ? "primary" : "secondary"}
          onClick={() => setSource("upload")}
        >
          Upload
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => field.onChange(null)}>
          Clear
        </Button>
      </div>

      <Card className="grid gap-4 p-4 md:grid-cols-[160px_1fr] md:items-start">
        <div className="aspect-square overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-black/5 dark:bg-white/5">
          {isUploading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResolvedImage image={value} alt={label} className="h-full w-full" fallbackClassName="h-full w-full" />
          )}
        </div>
        <div className="space-y-3">
          {source === "url" ? (
            <div className="space-y-1.5">
              <Label hint="Stored in JSONB">Image URL</Label>
              <Input
                value={value?.url ?? ""}
                onChange={(e) =>
                  field.onChange({ ...(value ?? {}), source: "url", url: e.target.value, file_path: null })
                }
                placeholder="https://…"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label hint="Uploads to Supabase Storage">Choose file</Label>
              <Input type="file" accept="image/*" onChange={onPickFile} disabled={isUploading} />
              <div className="text-xs text-[rgb(var(--muted))]">
                Recommended: square JPG/WEBP, under 1MB.
              </div>
            </div>
          )}
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </div>
      </Card>
    </div>
  );
}

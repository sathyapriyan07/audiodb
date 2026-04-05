import { supabase } from "@/services/supabase/client";
import type { ImageRef } from "@/types/media";

export const DEFAULT_STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "media";

export function resolveImageUrl(image: ImageRef | null | undefined): string | null {
  if (!image) return null;
  if (image.source === "url" && image.url) return image.url;
  if (image.source === "upload" && image.file_path) {
    const { data } = supabase.storage.from(DEFAULT_STORAGE_BUCKET).getPublicUrl(image.file_path);
    return data.publicUrl ?? null;
  }
  if (image.url) return image.url;
  return null;
}

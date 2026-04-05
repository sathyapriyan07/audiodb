import { supabase } from "@/services/supabase/client";
import { DEFAULT_STORAGE_BUCKET } from "@/services/images/resolveImage";
import type { ImageRef } from "@/types/media";

export async function uploadImageFile(file: File, opts?: { folder?: string }): Promise<ImageRef> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const folder = opts?.folder?.replace(/^\/+|\/+$/g, "") || "uploads";
  const filePath = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(DEFAULT_STORAGE_BUCKET).upload(filePath, file, {
    upsert: false,
    contentType: file.type || undefined,
    cacheControl: "31536000",
  });
  if (error) throw error;
  return { source: "upload", file_path: filePath, url: null };
}


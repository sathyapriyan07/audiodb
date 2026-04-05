import { supabase } from "@/services/supabase/client";
import type { ImageRef } from "@/types/media";
import { toOne } from "@/services/db/normalize";

export type AlbumRow = {
  id: string;
  title: string;
  artist_id: string;
  cover_image: ImageRef | null;
  release_date: string | null;
  created_at: string;
  updated_at: string;
  artist?: { id: string; name: string } | null;
};

export async function listAlbums(params?: { q?: string; limit?: number; offset?: number }) {
  const q = params?.q?.trim();
  let query = supabase
    .from("albums")
    .select("id,title,artist_id,cover_image,release_date,created_at,updated_at,artist:artists(id,name)")
    .order("release_date", { ascending: false });
  if (q) query = query.ilike("title", `%${q}%`);
  if (params?.limit) query = query.range(params.offset ?? 0, (params.offset ?? 0) + params.limit - 1);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ ...r, artist: toOne(r.artist) })) as unknown as AlbumRow[];
}

export async function getAlbum(albumId: string) {
  const { data, error } = await supabase
    .from("albums")
    .select("id,title,artist_id,cover_image,release_date,created_at,updated_at,artist:artists(id,name,profile_image)")
    .eq("id", albumId)
    .single();
  if (error) throw error;
  return { ...(data as any), artist: toOne((data as any).artist) } as any;
}

export async function upsertAlbum(values: {
  id?: string;
  title: string;
  artist_id: string;
  cover_image: ImageRef | null;
  release_date: string | null;
}) {
  const { data, error } = await supabase
    .from("albums")
    .upsert(values, { onConflict: "id" })
    .select("id,title,artist_id,cover_image,release_date,created_at,updated_at")
    .single();
  if (error) throw error;
  return data as AlbumRow;
}

export async function deleteAlbum(albumId: string) {
  const { error } = await supabase.from("albums").delete().eq("id", albumId);
  if (error) throw error;
}

export async function listAlbumStreamingLinks(albumId: string) {
  const { data, error } = await supabase
    .from("album_streaming_links")
    .select("url,platform:platforms(id,name,logo)")
    .eq("album_id", albumId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ url: r.url, platform: toOne(r.platform) })) as Array<{
    url: string;
    platform: { id: string; name: string; logo: string | null };
  }>;
}

export async function setAlbumStreamingLinks(
  albumId: string,
  links: Array<{ platform_id: string; url: string }>,
) {
  const { error: delErr } = await supabase.from("album_streaming_links").delete().eq("album_id", albumId);
  if (delErr) throw delErr;
  if (!links.length) return;
  const { error } = await supabase.from("album_streaming_links").insert(
    links.map((l) => ({ ...l, album_id: albumId })),
  );
  if (error) throw error;
}

export async function listAlbumSongs(albumId: string) {
  const { data, error } = await supabase
    .from("songs")
    .select("id,title,duration,release_date,cover_image")
    .eq("album_id", albumId)
    .order("release_date", { ascending: true })
    .order("title", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    title: string;
    duration: number | null;
    release_date: string | null;
    cover_image: ImageRef | null;
  }>;
}

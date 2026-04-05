import { supabase } from "@/services/supabase/client";
import type { ImageRef } from "@/types/media";

export type ArtistRow = {
  id: string;
  name: string;
  bio: string | null;
  profile_image: ImageRef | null;
  created_at: string;
  updated_at: string;
};

export async function listArtists(params?: { q?: string; limit?: number; offset?: number }) {
  const q = params?.q?.trim();
  let query = supabase
    .from("artists")
    .select("id,name,bio,profile_image,created_at,updated_at")
    .order("name", { ascending: true });
  if (q) query = query.ilike("name", `%${q}%`);
  if (params?.limit) query = query.range(params.offset ?? 0, (params.offset ?? 0) + params.limit - 1);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ArtistRow[];
}

export async function getArtist(artistId: string) {
  const { data, error } = await supabase
    .from("artists")
    .select("id,name,bio,profile_image,created_at,updated_at")
    .eq("id", artistId)
    .single();
  if (error) throw error;
  return data as ArtistRow;
}

export async function upsertArtist(values: {
  id?: string;
  name: string;
  bio: string | null;
  profile_image: ImageRef | null;
}) {
  const { data, error } = await supabase
    .from("artists")
    .upsert(values, { onConflict: "id" })
    .select("id,name,bio,profile_image,created_at,updated_at")
    .single();
  if (error) throw error;
  return data as ArtistRow;
}

export async function deleteArtist(artistId: string) {
  const { error } = await supabase.from("artists").delete().eq("id", artistId);
  if (error) throw error;
}

export async function listArtistAlbums(artistId: string) {
  const { data, error } = await supabase
    .from("album_artists")
    .select("album:albums(id,title,cover_image,release_date)")
    .eq("artist_id", artistId)
    .order("order", { ascending: true });
  if (error) throw error;
  return (data ?? [])
    .map((r: any) => r.album)
    .filter(Boolean) as Array<{ id: string; title: string; cover_image: ImageRef | null; release_date: string | null }>;
}

export async function listArtistTopSongs(artistId: string, limit = 10) {
  const { data, error } = await supabase
    .from("song_artists")
    .select("song:songs(id,title,cover_image,preview_url,album:albums(id,title))")
    .eq("artist_id", artistId)
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.song).filter(Boolean) as Array<{
    id: string;
    title: string;
    cover_image: ImageRef | null;
    preview_url: string | null;
    album: { id: string; title: string } | null;
  }>;
}

export async function listSimilarArtists(artistId: string, limit = 10) {
  const { data: albumRows, error: e1 } = await supabase
    .from("album_artists")
    .select("album_id")
    .eq("artist_id", artistId)
    .limit(200);
  if (e1) throw e1;
  const albumIds = Array.from(new Set((albumRows ?? []).map((r: any) => r.album_id).filter(Boolean)));
  if (!albumIds.length) return [];

  const { data: aaRows, error: e2 } = await supabase
    .from("album_artists")
    .select("artist_id")
    .in("album_id", albumIds)
    .neq("artist_id", artistId)
    .limit(500);
  if (e2) throw e2;

  const counts = new Map<string, number>();
  for (const r of aaRows ?? []) {
    const id = (r as any).artist_id as string;
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const ranked = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (!ranked.length) return [];
  const { data: artists, error: e3 } = await supabase
    .from("artists")
    .select("id,name,profile_image,bio")
    .in("id", ranked);
  if (e3) throw e3;

  const map = new Map((artists ?? []).map((a: any) => [a.id, a]));
  return ranked.map((id) => map.get(id)).filter(Boolean);
}

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
    .select("song:songs(id,title,cover_image,album:albums(id,title))")
    .eq("artist_id", artistId)
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.song).filter(Boolean) as Array<{
    id: string;
    title: string;
    cover_image: ImageRef | null;
    album: { id: string; title: string } | null;
  }>;
}

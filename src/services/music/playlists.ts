import { supabase } from "@/services/supabase/client";
import type { ImageRef } from "@/types/media";

export type PlaylistRow = {
  id: string;
  title: string;
  description: string | null;
  cover_image: ImageRef | null;
  created_at: string;
  updated_at: string;
};

export async function listPlaylists(params?: { q?: string; limit?: number; offset?: number }) {
  const q = params?.q?.trim();
  let query = supabase
    .from("playlists")
    .select("id,title,description,cover_image,created_at,updated_at")
    .order("updated_at", { ascending: false });
  if (q) query = query.ilike("title", `%${q}%`);
  if (params?.limit) query = query.range(params.offset ?? 0, (params.offset ?? 0) + params.limit - 1);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PlaylistRow[];
}

export async function getPlaylist(playlistId: string) {
  const { data, error } = await supabase
    .from("playlists")
    .select("id,title,description,cover_image,created_at,updated_at")
    .eq("id", playlistId)
    .single();
  if (error) throw error;
  return data as PlaylistRow;
}

export async function listPlaylistSongs(playlistId: string) {
  const { data, error } = await supabase
    .from("playlist_songs")
    .select(
      "song_id,order,song:songs(id,title,cover_image,album:albums(id,title,artist:artists!albums_artist_id_fkey(id,name)))",
    )
    .eq("playlist_id", playlistId)
    .order("order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Array<{
    song_id: string;
    order: number;
    song: any;
  }>;
}

export async function setPlaylistSongs(playlistId: string, songIdsInOrder: string[]) {
  const { error: delErr } = await supabase.from("playlist_songs").delete().eq("playlist_id", playlistId);
  if (delErr) throw delErr;
  if (!songIdsInOrder.length) return;
  const { error } = await supabase.from("playlist_songs").insert(
    songIdsInOrder.map((songId, idx) => ({
      playlist_id: playlistId,
      song_id: songId,
      order: idx,
    })),
  );
  if (error) throw error;
}

export async function upsertPlaylist(values: {
  id?: string;
  title: string;
  description: string | null;
  cover_image: ImageRef | null;
}) {
  const { data, error } = await supabase
    .from("playlists")
    .upsert(values, { onConflict: "id" })
    .select("id,title,description,cover_image,created_at,updated_at")
    .single();
  if (error) throw error;
  return data as PlaylistRow;
}

export async function deletePlaylist(playlistId: string) {
  const { error } = await supabase.from("playlists").delete().eq("id", playlistId);
  if (error) throw error;
}

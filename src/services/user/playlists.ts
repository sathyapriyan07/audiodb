import type { ImageRef } from "@/types/media";
import { supabase } from "@/services/supabase/client";
import { toOne } from "@/services/db/normalize";

export type UserPlaylistRow = {
  id: string;
  title: string;
  description: string | null;
  cover_image: ImageRef | null;
  created_at: string;
  updated_at: string;
};

export async function listUserPlaylists() {
  const { data, error } = await supabase
    .from("user_playlists")
    .select("id,title,description,cover_image,created_at,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserPlaylistRow[];
}

export async function createUserPlaylist(values: {
  title: string;
  description: string | null;
  cover_image: ImageRef | null;
}) {
  const { data, error } = await supabase
    .from("user_playlists")
    .insert(values)
    .select("id,title,description,cover_image,created_at,updated_at")
    .single();
  if (error) throw error;
  return data as UserPlaylistRow;
}

export async function getUserPlaylist(playlistId: string) {
  const { data, error } = await supabase
    .from("user_playlists")
    .select("id,title,description,cover_image,created_at,updated_at")
    .eq("id", playlistId)
    .single();
  if (error) throw error;
  return data as UserPlaylistRow;
}

export async function listUserPlaylistSongs(playlistId: string) {
  const { data, error } = await supabase
    .from("user_playlist_songs")
    .select(
      "song_id,order,song:songs(id,title,cover_image,preview_url,album:albums(id,title,artist:artists!albums_artist_id_fkey(id,name)))",
    )
    .eq("playlist_id", playlistId)
    .order("order", { ascending: true });
  if (error) throw error;
  const normalized = (data ?? []).map((r: any) => ({ ...r, song: { ...r.song, album: toOne(r.song?.album) } }));
  return normalized as Array<{ song_id: string; order: number; song: any }>;
}

export async function addSongToUserPlaylist(playlistId: string, songId: string) {
  const { data: existing, error: e1 } = await supabase
    .from("user_playlist_songs")
    .select("order")
    .eq("playlist_id", playlistId)
    .order("order", { ascending: false })
    .limit(1);
  if (e1) throw e1;
  const nextOrder = (existing?.[0]?.order ?? -1) + 1;

  const { error } = await supabase
    .from("user_playlist_songs")
    .upsert({ playlist_id: playlistId, song_id: songId, order: nextOrder }, { onConflict: "playlist_id,song_id" });
  if (error) throw error;
}

export async function removeSongFromUserPlaylist(playlistId: string, songId: string) {
  const { error } = await supabase
    .from("user_playlist_songs")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("song_id", songId);
  if (error) throw error;
}


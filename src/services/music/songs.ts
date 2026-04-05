import { supabase } from "@/services/supabase/client";
import type { ImageRef } from "@/types/media";
import { toOne } from "@/services/db/normalize";

export type SongRow = {
  id: string;
  title: string;
  duration: number | null;
  release_date: string | null;
  album_id: string | null;
  cover_image: ImageRef | null;
  created_at: string;
  updated_at: string;
  album?: { id: string; title: string } | null;
};

export type SongArtistRow = {
  artist_id: string;
  role: string | null;
  artist: { id: string; name: string; profile_image: ImageRef | null };
};

export type SongStreamingLinkRow = {
  platform_id: string;
  url: string;
  platform: { id: string; name: string; logo: string | null };
};

export async function listSongs(params?: { q?: string; limit?: number; offset?: number }) {
  const q = params?.q?.trim();
  let query = supabase
    .from("songs")
    .select("id,title,duration,release_date,album_id,cover_image,created_at,updated_at,album:albums(id,title)")
    .order("release_date", { ascending: false });
  if (q) query = query.ilike("title", `%${q}%`);
  if (params?.limit) query = query.range(params.offset ?? 0, (params.offset ?? 0) + params.limit - 1);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ ...r, album: toOne(r.album) })) as unknown as SongRow[];
}

export async function getSong(songId: string) {
  const { data, error } = await supabase
    .from("songs")
    .select(
      "id,title,duration,release_date,album_id,cover_image,created_at,updated_at,album:albums(id,title,cover_image,release_date,artist:artists(id,name,profile_image))",
    )
    .eq("id", songId)
    .single();
  if (error) throw error;
  const album = toOne((data as any).album);
  return {
    ...(data as any),
    album: album
      ? {
          ...album,
          artist: toOne((album as any).artist),
        }
      : null,
  } as any;
}

export async function listSongArtists(songId: string) {
  const { data, error } = await supabase
    .from("song_artists")
    .select("artist_id,role,artist:artists(id,name,profile_image)")
    .eq("song_id", songId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ ...r, artist: toOne(r.artist) })) as any as SongArtistRow[];
}

export async function setSongArtists(
  songId: string,
  items: Array<{ artist_id: string; role: string | null }>,
) {
  const { error: delErr } = await supabase.from("song_artists").delete().eq("song_id", songId);
  if (delErr) throw delErr;
  if (!items.length) return;
  const { error } = await supabase
    .from("song_artists")
    .insert(items.map((i) => ({ ...i, song_id: songId })));
  if (error) throw error;
}

export async function listSongStreamingLinks(songId: string) {
  const { data, error } = await supabase
    .from("song_streaming_links")
    .select("platform_id,url,platform:platforms(id,name,logo)")
    .eq("song_id", songId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ ...r, platform: toOne(r.platform) })) as any as SongStreamingLinkRow[];
}

export async function setSongStreamingLinks(
  songId: string,
  links: Array<{ platform_id: string; url: string }>,
) {
  const { error: delErr } = await supabase
    .from("song_streaming_links")
    .delete()
    .eq("song_id", songId);
  if (delErr) throw delErr;
  if (!links.length) return;
  const { error } = await supabase.from("song_streaming_links").insert(
    links.map((l) => ({ ...l, song_id: songId })),
  );
  if (error) throw error;
}

export async function upsertSong(values: {
  id?: string;
  title: string;
  duration: number | null;
  release_date: string | null;
  album_id: string | null;
  cover_image: ImageRef | null;
}) {
  const { data, error } = await supabase
    .from("songs")
    .upsert(values, { onConflict: "id" })
    .select("id,title,duration,release_date,album_id,cover_image,created_at,updated_at")
    .single();
  if (error) throw error;
  return data as SongRow;
}

export async function deleteSong(songId: string) {
  const { error } = await supabase.from("songs").delete().eq("id", songId);
  if (error) throw error;
}

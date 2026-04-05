import { supabase } from "@/services/supabase/client";

export type SearchResults = {
  songs: Array<{ id: string; title: string; cover_image: any; album?: { id: string; title: string } | null }>;
  albums: Array<{ id: string; title: string; cover_image: any; artist?: { id: string; name: string } | null }>;
  artists: Array<{ id: string; name: string; profile_image: any }>;
  playlists: Array<{ id: string; title: string; cover_image: any }>;
};

export async function searchAll(qRaw: string, limit = 8): Promise<SearchResults> {
  const q = qRaw.trim();
  if (!q) return { songs: [], albums: [], artists: [], playlists: [] };

  const [songs, albums, artists, playlists] = await Promise.all([
    supabase
      .from("songs")
      .select("id,title,cover_image,album:albums(id,title)")
      .ilike("title", `%${q}%`)
      .limit(limit),
    supabase
      .from("albums")
      .select("id,title,cover_image,artist:artists(id,name)")
      .ilike("title", `%${q}%`)
      .limit(limit),
    supabase.from("artists").select("id,name,profile_image").ilike("name", `%${q}%`).limit(limit),
    supabase
      .from("playlists")
      .select("id,title,cover_image")
      .ilike("title", `%${q}%`)
      .limit(limit),
  ]);

  if (songs.error) throw songs.error;
  if (albums.error) throw albums.error;
  if (artists.error) throw artists.error;
  if (playlists.error) throw playlists.error;

  return {
    songs: (songs.data ?? []) as any,
    albums: (albums.data ?? []) as any,
    artists: (artists.data ?? []) as any,
    playlists: (playlists.data ?? []) as any,
  };
}


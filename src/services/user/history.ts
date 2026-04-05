import { supabase } from "@/services/supabase/client";
import { toOne } from "@/services/db/normalize";

export async function listRecentlyPlayed(limit = 30) {
  const { data, error } = await supabase
    .from("user_play_history")
    .select(
      "played_at,song:songs(id,title,cover_image,preview_url,album:albums(id,title,artist:artists!albums_artist_id_fkey(id,name)))",
    )
    .order("played_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    played_at: r.played_at,
    song: { ...r.song, album: toOne(r.song?.album) },
  }));
}


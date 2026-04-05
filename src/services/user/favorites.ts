import { supabase } from "@/services/supabase/client";
import type { EntityType } from "@/types/media";
import { toOne } from "@/services/db/normalize";

export async function isFavorite(entityType: EntityType, entityId: string) {
  const { data, error } = await supabase
    .from("user_favorites")
    .select("entity_id")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.entity_id);
}

export async function setFavorite(entityType: EntityType, entityId: string, fav: boolean) {
  if (fav) {
    const { error } = await supabase.from("user_favorites").insert({ entity_type: entityType, entity_id: entityId });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);
    if (error) throw error;
  }
}

export async function listFavoriteEntities(entityType: EntityType, limit = 50) {
  const { data, error } = await supabase
    .from("user_favorites")
    .select("entity_id,created_at")
    .eq("entity_type", entityType)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const ids = (data ?? []).map((r: any) => r.entity_id).filter(Boolean);
  if (!ids.length) return [];

  if (entityType === "songs") {
    const { data: songs, error: e } = await supabase
      .from("songs")
      .select("id,title,cover_image,preview_url,album:albums(id,title,artist:artists!albums_artist_id_fkey(id,name))")
      .in("id", ids);
    if (e) throw e;
    const map = new Map((songs ?? []).map((s: any) => [s.id, { ...s, album: toOne(s.album) }]));
    return ids.map((id) => map.get(id)).filter(Boolean);
  }

  if (entityType === "albums") {
    const { data: albums, error: e } = await supabase
      .from("albums")
      .select("id,title,cover_image,release_date,album_artists(order,artist:artists!album_artists_artist_id_fkey(id,name,profile_image))")
      .in("id", ids);
    if (e) throw e;
    const normalized = (albums ?? []).map((a: any) => ({
      ...a,
      album_artists: (a.album_artists ?? []).map((aa: any) => ({ ...aa, artist: toOne(aa.artist) })),
    }));
    const map = new Map(normalized.map((a: any) => [a.id, a]));
    return ids.map((id) => map.get(id)).filter(Boolean);
  }

  if (entityType === "artists") {
    const { data: artists, error: e } = await supabase
      .from("artists")
      .select("id,name,profile_image,bio")
      .in("id", ids);
    if (e) throw e;
    const map = new Map((artists ?? []).map((a: any) => [a.id, a]));
    return ids.map((id) => map.get(id)).filter(Boolean);
  }

  // playlists favorites not used currently
  return [];
}


import { supabase } from "@/services/supabase/client";
import type { EntityType, HomeSection, HomeSectionItem } from "@/types/media";

type EntityMap = Record<string, any>;

async function fetchByType(entityType: EntityType, ids: string[]) {
  if (!ids.length) return {} as EntityMap;

  if (entityType === "songs") {
    const { data, error } = await supabase
      .from("songs")
      .select("id,title,cover_image,album:albums(id,title,artist:artists(id,name))")
      .in("id", ids);
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((r: any) => [r.id, r]));
  }
  if (entityType === "albums") {
    const { data, error } = await supabase
      .from("albums")
      .select("id,title,cover_image,release_date,artist:artists(id,name,profile_image)")
      .in("id", ids);
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((r: any) => [r.id, r]));
  }
  if (entityType === "artists") {
    const { data, error } = await supabase
      .from("artists")
      .select("id,name,profile_image,bio")
      .in("id", ids);
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((r: any) => [r.id, r]));
  }

  const { data, error } = await supabase
    .from("playlists")
    .select("id,title,cover_image,description")
    .in("id", ids);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r: any) => [r.id, r]));
}

export async function resolveHomeSections(
  sections: HomeSection[],
  items: HomeSectionItem[],
): Promise<Array<{ section: HomeSection; entities: any[] }>> {
  const itemsBySection = new Map<string, HomeSectionItem[]>();
  for (const it of items) {
    const list = itemsBySection.get(it.section_id) ?? [];
    list.push(it);
    itemsBySection.set(it.section_id, list);
  }

  const idsByType: Record<EntityType, string[]> = {
    songs: [],
    albums: [],
    artists: [],
    playlists: [],
  };

  for (const it of items) {
    idsByType[it.entity_type].push(it.entity_id);
  }

  const [songs, albums, artists, playlists] = await Promise.all([
    fetchByType("songs", Array.from(new Set(idsByType.songs))),
    fetchByType("albums", Array.from(new Set(idsByType.albums))),
    fetchByType("artists", Array.from(new Set(idsByType.artists))),
    fetchByType("playlists", Array.from(new Set(idsByType.playlists))),
  ]);

  const maps: Record<EntityType, EntityMap> = { songs, albums, artists, playlists };

  return sections.map((section) => {
    const sectionItems = (itemsBySection.get(section.id) ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    const entities = sectionItems.map((it) => maps[it.entity_type]?.[it.entity_id]).filter(Boolean);
    return { section, entities };
  });
}


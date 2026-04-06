import { z } from "zod";

import { supabase } from "@/services/supabase/client";
import { getPlatformByName, getOrCreatePlatformByName } from "@/services/music/platforms";
import { upsertArtist } from "@/services/music/artists";
import { setAlbumArtists, upsertAlbum } from "@/services/music/albums";
import { upsertPlaylist } from "@/services/music/playlists";
import { setSongArtists, upsertSong, upsertSongStreamingLink } from "@/services/music/songs";

export type BulkEntity = "artists" | "albums" | "songs" | "platforms" | "playlists" | "sections";

const ArtistInputSchema = z.object({
  name: z.string().min(1),
  bio: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
});

const PlatformInputSchema = z.object({
  name: z.string().min(1),
  logo: z.string().url().nullable().optional(),
});

const AlbumInputSchema = z.object({
  title: z.string().min(1),
  artists: z.array(z.string().min(1)).min(1),
  release_date: z.string().nullable().optional(),
  cover_url: z.string().url().nullable().optional(),
});

const SongInputSchema = z.object({
  title: z.string().min(1),
  album_title: z.string().nullable().optional(),
  artists: z.array(z.string().min(1)).optional().default([]),
  duration: z.number().int().positive().nullable().optional(),
  release_date: z.string().nullable().optional(),
  cover_url: z.string().url().nullable().optional(),
  preview_url: z.string().url().nullable().optional(),
  deezer_url: z.string().url().nullable().optional(),
});

const PlaylistInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  cover_url: z.string().url().nullable().optional(),
});

const HomeSectionInputSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().nullable().optional(),
  entity_type: z.enum(["songs", "albums", "artists", "playlists"]),
  sort_order: z.number().int().min(0).default(0),
  is_featured: z.boolean().default(false),
});

export type ParsedArtistInput = z.infer<typeof ArtistInputSchema>;
export type ParsedPlatformInput = z.infer<typeof PlatformInputSchema>;
export type ParsedAlbumInput = z.infer<typeof AlbumInputSchema>;
export type ParsedSongInput = z.infer<typeof SongInputSchema>;
export type ParsedPlaylistInput = z.infer<typeof PlaylistInputSchema>;
export type ParsedHomeSectionInput = z.infer<typeof HomeSectionInputSchema>;

export type ParseResult<T> = {
  items: T[];
  errors: string[];
};

function splitNonEmptyLines(raw: string) {
  return raw
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function parseDelimitedWithHeader(raw: string) {
  const lines = splitNonEmptyLines(raw);
  if (!lines.length) return { rows: [], errors: [] as string[] };

  const delim = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(delim).map((h) => h.trim());
  const rows: Array<Record<string, string>> = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(delim);
    if (parts.length !== headers.length) {
      errors.push(`Line ${i + 1}: expected ${headers.length} columns, got ${parts.length}.`);
      continue;
    }
    const row: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) row[headers[c]] = (parts[c] ?? "").trim();
    rows.push(row);
  }

  return { rows, errors };
}

function parseJsonLines(raw: string) {
  const lines = splitNonEmptyLines(raw);
  const items: any[] = [];
  const errors: string[] = [];
  lines.forEach((line, idx) => {
    try {
      items.push(JSON.parse(line));
    } catch (e) {
      errors.push(`Line ${idx + 1}: invalid JSON.`);
    }
  });
  return { items, errors };
}

export function parseBulkInput(entity: BulkEntity, raw: string): ParseResult<any> {
  const lines = splitNonEmptyLines(raw);
  if (!lines.length) return { items: [], errors: [] };

  const isJsonl = lines[0].startsWith("{");
  const errors: string[] = [];
  const parsed: any[] = [];

  if (isJsonl) {
    const { items, errors: jsonErrors } = parseJsonLines(raw);
    errors.push(...jsonErrors);
    parsed.push(...items);
  } else {
    const { rows, errors: rowErrors } = parseDelimitedWithHeader(raw);
    errors.push(...rowErrors);
    parsed.push(...rows);
  }

  const toStrArr = (v: any) =>
    (typeof v === "string" ? v.split("|") : Array.isArray(v) ? v : [])
      .map((s) => String(s).trim())
      .filter(Boolean);

  if (entity === "artists") {
    const items = parsed
      .map((r) => ({
        name: String(r.name ?? r.Name ?? "").trim(),
        bio: (r.bio ?? r.Bio ?? "").toString().trim() || null,
        image_url: (r.image_url ?? r.profile_image_url ?? r.profile_url ?? r.url ?? "").toString().trim() || null,
      }))
      .map((r, i) => {
        const p = ArtistInputSchema.safeParse(r);
        if (!p.success) errors.push(`Row ${i + 1}: ${p.error.issues[0]?.message ?? "Invalid"}`);
        return p.success ? p.data : null;
      })
      .filter(Boolean);
    return { items, errors };
  }

  if (entity === "platforms") {
    const items = parsed
      .map((r) => ({
        name: String(r.name ?? r.Name ?? "").trim(),
        logo: (r.logo ?? r.logo_url ?? r.url ?? "").toString().trim() || null,
      }))
      .map((r, i) => {
        const p = PlatformInputSchema.safeParse(r);
        if (!p.success) errors.push(`Row ${i + 1}: ${p.error.issues[0]?.message ?? "Invalid"}`);
        return p.success ? p.data : null;
      })
      .filter(Boolean);
    return { items, errors };
  }

  if (entity === "albums") {
    const items = parsed
      .map((r) => ({
        title: String(r.title ?? r.Title ?? "").trim(),
        artists: toStrArr(r.artists ?? r.artist ?? r.Artists ?? r.Artist),
        release_date: (r.release_date ?? r.ReleaseDate ?? r.release ?? "").toString().trim() || null,
        cover_url: (r.cover_url ?? r.cover ?? r.image_url ?? "").toString().trim() || null,
      }))
      .map((r, i) => {
        const p = AlbumInputSchema.safeParse(r);
        if (!p.success) errors.push(`Row ${i + 1}: ${p.error.issues[0]?.message ?? "Invalid"}`);
        return p.success ? p.data : null;
      })
      .filter(Boolean);
    return { items, errors };
  }

  if (entity === "playlists") {
    const items = parsed
      .map((r) => ({
        title: String(r.title ?? r.Title ?? "").trim(),
        description: (r.description ?? r.Description ?? "").toString().trim() || null,
        cover_url: (r.cover_url ?? r.cover ?? r.image_url ?? "").toString().trim() || null,
      }))
      .map((r, i) => {
        const p = PlaylistInputSchema.safeParse(r);
        if (!p.success) errors.push(`Row ${i + 1}: ${p.error.issues[0]?.message ?? "Invalid"}`);
        return p.success ? p.data : null;
      })
      .filter(Boolean);
    return { items, errors };
  }

  if (entity === "sections") {
    const toBool = (v: any) => {
      if (typeof v === "boolean") return v;
      const s = String(v ?? "").trim().toLowerCase();
      return s === "1" || s === "true" || s === "yes" || s === "y";
    };

    const items = parsed
      .map((r) => ({
        title: String(r.title ?? r.Title ?? "").trim(),
        subtitle: (r.subtitle ?? r.Subtitle ?? "").toString().trim() || null,
        entity_type: String(r.entity_type ?? r.type ?? r.EntityType ?? "").trim() as any,
        sort_order: r.sort_order ? Number(r.sort_order) : 0,
        is_featured: toBool(r.is_featured ?? r.featured ?? r.Featured),
      }))
      .map((r, i) => {
        const p = HomeSectionInputSchema.safeParse(r);
        if (!p.success) errors.push(`Row ${i + 1}: ${p.error.issues[0]?.message ?? "Invalid"}`);
        return p.success ? p.data : null;
      })
      .filter(Boolean);

    return { items, errors };
  }

  const items = parsed
    .map((r) => ({
      title: String(r.title ?? r.Title ?? "").trim(),
      album_title: (r.album_title ?? r.album ?? r.Album ?? "").toString().trim() || null,
      artists: toStrArr(r.artists ?? r.artist ?? r.Artists ?? r.Artist),
      duration: r.duration ? Number(r.duration) : null,
      release_date: (r.release_date ?? r.ReleaseDate ?? r.release ?? "").toString().trim() || null,
      cover_url: (r.cover_url ?? r.cover ?? r.image_url ?? "").toString().trim() || null,
      preview_url: (r.preview_url ?? r.preview ?? "").toString().trim() || null,
      deezer_url: (r.deezer_url ?? r.deezer ?? "").toString().trim() || null,
    }))
    .map((r, i) => {
      const p = SongInputSchema.safeParse(r);
      if (!p.success) errors.push(`Row ${i + 1}: ${p.error.issues[0]?.message ?? "Invalid"}`);
      return p.success ? p.data : null;
    })
    .filter(Boolean);
  return { items, errors };
}

async function getOrCreateArtistByName(name: string) {
  const trimmed = name.trim();
  const { data, error } = await supabase.from("artists").select("id,name").eq("name", trimmed).maybeSingle();
  if (error) throw error;
  if (data?.id) return data.id as string;
  const created = await upsertArtist({ name: trimmed, bio: null, profile_image: null });
  return created.id;
}

async function getAlbumIdByTitleAndPrimaryArtist(title: string, primaryArtistId: string | null) {
  if (!primaryArtistId) return null;
  const { data, error } = await supabase
    .from("albums")
    .select("id")
    .eq("title", title)
    .eq("artist_id", primaryArtistId)
    .maybeSingle();
  if (error) throw error;
  return (data?.id as string | undefined) ?? null;
}

async function getSongIdByTitleAndAlbum(title: string, albumId: string | null) {
  if (!albumId) return null;
  const { data, error } = await supabase
    .from("songs")
    .select("id")
    .eq("title", title)
    .eq("album_id", albumId)
    .maybeSingle();
  if (error) throw error;
  return (data?.id as string | undefined) ?? null;
}

export async function bulkCreate(entity: BulkEntity, items: any[]) {
  const createdIds: string[] = [];
  const skipped = { duplicates: 0 };

  if (entity === "artists") {
    for (const it of items as ParsedArtistInput[]) {
      const existing = await supabase.from("artists").select("id").eq("name", it.name).maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data?.id) {
        skipped.duplicates += 1;
        continue;
      }
      const created = await upsertArtist({
        name: it.name,
        bio: it.bio ?? null,
        profile_image: it.image_url ? { source: "url", url: it.image_url, file_path: null } : null,
      });
      createdIds.push(created.id);
    }
    return { createdIds, skipped };
  }

  if (entity === "platforms") {
    for (const it of items as ParsedPlatformInput[]) {
      const existing = await getPlatformByName(it.name);
      if (existing) {
        skipped.duplicates += 1;
        continue;
      }
      const created = await getOrCreatePlatformByName({ name: it.name, logo: it.logo ?? null });
      createdIds.push(created.id);
    }
    return { createdIds, skipped };
  }

  if (entity === "albums") {
    for (const it of items as ParsedAlbumInput[]) {
      const artistIdsOrdered: string[] = [];
      for (const name of it.artists) artistIdsOrdered.push(await getOrCreateArtistByName(name));
      const primaryArtistId = artistIdsOrdered[0] ?? null;
      const dup = await getAlbumIdByTitleAndPrimaryArtist(it.title, primaryArtistId);
      if (dup) {
        skipped.duplicates += 1;
        continue;
      }
      const album = await upsertAlbum({
        title: it.title,
        artist_id: primaryArtistId,
        release_date: it.release_date ?? null,
        cover_image: it.cover_url ? { source: "url", url: it.cover_url, file_path: null } : null,
      });
      await setAlbumArtists(
        album.id,
        artistIdsOrdered.map((id, idx) => ({ artist_id: id, role: idx === 0 ? "Primary" : "Contributor" })),
      );
      createdIds.push(album.id);
    }
    return { createdIds, skipped };
  }

  if (entity === "playlists") {
    for (const it of items as ParsedPlaylistInput[]) {
      const existing = await supabase.from("playlists").select("id").eq("title", it.title).maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data?.id) {
        skipped.duplicates += 1;
        continue;
      }
      const created = await upsertPlaylist({
        title: it.title,
        description: it.description?.trim() ? it.description.trim() : null,
        cover_image: it.cover_url ? { source: "url", url: it.cover_url, file_path: null } : null,
      });
      createdIds.push(created.id);
    }
    return { createdIds, skipped };
  }

  if (entity === "sections") {
    const existingFeatured = await supabase
      .from("home_sections")
      .select("id")
      .eq("is_featured", true)
      .maybeSingle();
    if (existingFeatured.error) throw existingFeatured.error;

    let featuredAllowed = !existingFeatured.data?.id;

    for (const it of items as ParsedHomeSectionInput[]) {
      const dup = await supabase
        .from("home_sections")
        .select("id")
        .eq("title", it.title)
        .eq("entity_type", it.entity_type)
        .maybeSingle();
      if (dup.error) throw dup.error;
      if (dup.data?.id) {
        skipped.duplicates += 1;
        continue;
      }

      const makeFeatured = Boolean(it.is_featured) && featuredAllowed;
      if (makeFeatured) featuredAllowed = false;

      const { data, error } = await supabase
        .from("home_sections")
        .insert({
          title: it.title,
          subtitle: it.subtitle?.trim() ? it.subtitle.trim() : null,
          entity_type: it.entity_type,
          sort_order: it.sort_order ?? 0,
          is_featured: makeFeatured,
        })
        .select("id")
        .single();
      if (error) throw error;
      createdIds.push(data.id as string);
    }

    return { createdIds, skipped };
  }

  // songs
  const deezerPlatform = await getOrCreatePlatformByName({
    name: "Deezer",
    logo: "https://e-cdns-files.dzcdn.net/cache/images/common/favicon/favicon-32x32.7a4809321bdc3f2dbd4f31f4c8c9ea33.png",
  });

  for (const it of items as ParsedSongInput[]) {
    const artistIdsOrdered: string[] = [];
    for (const name of it.artists ?? []) artistIdsOrdered.push(await getOrCreateArtistByName(name));

    let albumId: string | null = null;
    if (it.album_title) {
      const primaryArtistId = artistIdsOrdered[0] ?? null;
      const existingAlbumId = await getAlbumIdByTitleAndPrimaryArtist(it.album_title, primaryArtistId);
      if (existingAlbumId) albumId = existingAlbumId;
      else if (it.album_title && primaryArtistId) {
        const album = await upsertAlbum({
          title: it.album_title,
          artist_id: primaryArtistId,
          release_date: it.release_date ?? null,
          cover_image: it.cover_url ? { source: "url", url: it.cover_url, file_path: null } : null,
        });
        await setAlbumArtists(
          album.id,
          artistIdsOrdered.map((id, idx) => ({ artist_id: id, role: idx === 0 ? "Primary" : "Contributor" })),
        );
        albumId = album.id;
      }
    }

    const dup = await getSongIdByTitleAndAlbum(it.title, albumId);
    if (dup) {
      skipped.duplicates += 1;
      continue;
    }

    const song = await upsertSong({
      title: it.title,
      duration: it.duration ?? null,
      release_date: it.release_date ?? null,
      album_id: albumId,
      cover_image: it.cover_url ? { source: "url", url: it.cover_url, file_path: null } : null,
      preview_url: it.preview_url ?? null,
      lyrics: null,
    });
    if (artistIdsOrdered.length) {
      await setSongArtists(
        song.id,
        artistIdsOrdered.map((id, idx) => ({ artist_id: id, role: idx === 0 ? "Primary" : "Contributor" })),
      );
    }

    if (it.deezer_url) {
      await upsertSongStreamingLink(song.id, { platform_id: deezerPlatform.id, url: it.deezer_url });
    }

    createdIds.push(song.id);
  }

  return { createdIds, skipped };
}

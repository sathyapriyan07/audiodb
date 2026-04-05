import type { ImageRef } from "@/types/media";
import { supabase } from "@/services/supabase/client";
import { toOne } from "@/services/db/normalize";
import { getLocalIdByExternalId, linkExternalId } from "@/services/import/externalLinks";
import { getOrCreatePlatformByName } from "@/services/music/platforms";
import { setAlbumArtists, upsertAlbum } from "@/services/music/albums";
import { setSongArtists, upsertSong, upsertSongStreamingLink } from "@/services/music/songs";

export type ImportResult = {
  artistIds: string[];
  albumId: string | null;
  songId: string | null;
  wasExisting: boolean;
};

function urlImage(url: string | null | undefined): ImageRef | null {
  if (!url) return null;
  return { source: "url", url, file_path: null };
}

async function getOrCreateArtistByDeezer(params: { deezerArtist: any }) {
  const externalId = String(params.deezerArtist.id);
  const linked = await getLocalIdByExternalId({
    provider: "deezer",
    entityType: "artists",
    externalId,
  });
  if (linked) return { id: linked, wasExisting: true };

  // fallback by unique name
  const name = String(params.deezerArtist.name).trim();
  const { data: existingByName, error: selErr } = await supabase
    .from("artists")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existingByName?.id) {
    await linkExternalId({ provider: "deezer", entityType: "artists", externalId, localId: existingByName.id });
    return { id: existingByName.id as string, wasExisting: true };
  }

  const profile = urlImage(params.deezerArtist.picture_xl ?? params.deezerArtist.picture_medium ?? params.deezerArtist.picture ?? null);
  const { data, error } = await supabase
    .from("artists")
    .insert({ name, bio: null, profile_image: profile })
    .select("id")
    .single();
  if (error) throw error;
  await linkExternalId({ provider: "deezer", entityType: "artists", externalId, localId: data.id as string });
  return { id: data.id as string, wasExisting: false };
}

async function getOrCreateAlbumByDeezer(params: {
  deezerAlbum: any;
  artistIdsOrdered: string[];
  titleOverride?: string | null;
  coverUrlOverride?: string | null;
  releaseDateOverride?: string | null;
}) {
  const externalId = String(params.deezerAlbum.id);
  const linked = await getLocalIdByExternalId({ provider: "deezer", entityType: "albums", externalId });
  if (linked) return { id: linked, wasExisting: true };

  const title = (params.titleOverride ?? params.deezerAlbum.title ?? "").toString().trim();
  const primaryArtistId = params.artistIdsOrdered[0] ?? null;

  // best-effort duplicate prevention: title + primary artist_id
  if (primaryArtistId) {
    const { data: existing, error: selErr } = await supabase
      .from("albums")
      .select("id")
      .eq("title", title)
      .eq("artist_id", primaryArtistId)
      .maybeSingle();
    if (selErr) throw selErr;
    if (existing?.id) {
      await linkExternalId({ provider: "deezer", entityType: "albums", externalId, localId: existing.id as string });
      return { id: existing.id as string, wasExisting: true };
    }
  }

  const coverUrl = params.coverUrlOverride ?? params.deezerAlbum.cover_xl ?? params.deezerAlbum.cover_medium ?? params.deezerAlbum.cover ?? null;
  const releaseDate = params.releaseDateOverride ?? params.deezerAlbum.release_date ?? null;

  const album = await upsertAlbum({
    title,
    artist_id: primaryArtistId,
    cover_image: urlImage(coverUrl),
    release_date: releaseDate,
  });
  await setAlbumArtists(
    album.id,
    params.artistIdsOrdered.map((id, idx) => ({ artist_id: id, role: idx === 0 ? "Primary" : "Contributor" })),
  );

  await linkExternalId({ provider: "deezer", entityType: "albums", externalId, localId: album.id });
  return { id: album.id, wasExisting: false };
}

async function getOrCreateSongByDeezer(params: {
  deezerTrack: any;
  albumId: string | null;
  artistIdsOrdered: string[];
  titleOverride?: string | null;
  coverUrlOverride?: string | null;
  releaseDateOverride?: string | null;
}) {
  const externalId = String(params.deezerTrack.id);
  const linked = await getLocalIdByExternalId({ provider: "deezer", entityType: "songs", externalId });
  if (linked) return { id: linked, wasExisting: true };

  const title = (params.titleOverride ?? params.deezerTrack.title ?? "").toString().trim();

  // best-effort duplicate prevention: title + album_id
  if (params.albumId) {
    const { data: existing, error: selErr } = await supabase
      .from("songs")
      .select("id")
      .eq("title", title)
      .eq("album_id", params.albumId)
      .maybeSingle();
    if (selErr) throw selErr;
    if (existing?.id) {
      await linkExternalId({ provider: "deezer", entityType: "songs", externalId, localId: existing.id as string });
      return { id: existing.id as string, wasExisting: true };
    }
  }

  const coverUrl =
    params.coverUrlOverride ??
    params.deezerTrack.album?.cover_xl ??
    params.deezerTrack.album?.cover_medium ??
    params.deezerTrack.album?.cover ??
    null;

  const song = await upsertSong({
    title,
    duration: Number.isFinite(params.deezerTrack.duration) ? Number(params.deezerTrack.duration) : null,
    release_date: params.releaseDateOverride ?? null,
    album_id: params.albumId,
    cover_image: urlImage(coverUrl),
    preview_url: params.deezerTrack.preview ?? null,
  });

  await setSongArtists(
    song.id,
    params.artistIdsOrdered.map((id, idx) => ({ artist_id: id, role: idx === 0 ? "Primary" : "Contributor" })),
  );

  await linkExternalId({ provider: "deezer", entityType: "songs", externalId, localId: song.id });
  return { id: song.id, wasExisting: false };
}

export async function ensureDeezerPlatform() {
  const platform = await getOrCreatePlatformByName({
    name: "Deezer",
    logo: "https://e-cdns-files.dzcdn.net/cache/images/common/favicon/favicon-32x32.7a4809321bdc3f2dbd4f31f4c8c9ea33.png",
  });
  return platform.id;
}

export async function importDeezerTrack(params: {
  deezerTrack: any;
  overrides?: {
    songTitle?: string;
    albumTitle?: string;
    coverUrl?: string;
    releaseDate?: string;
  };
}) {
  const contributors = (params.deezerTrack.contributors ?? []).length
    ? params.deezerTrack.contributors
    : [params.deezerTrack.artist];

  const artistIds: string[] = [];
  let anyExisting = false;
  for (const a of contributors) {
    const { id, wasExisting } = await getOrCreateArtistByDeezer({ deezerArtist: a });
    artistIds.push(id);
    anyExisting ||= wasExisting;
  }

  const albumRes = await getOrCreateAlbumByDeezer({
    deezerAlbum: params.deezerTrack.album,
    artistIdsOrdered: artistIds,
    titleOverride: params.overrides?.albumTitle ?? null,
    coverUrlOverride: params.overrides?.coverUrl ?? null,
    releaseDateOverride: params.overrides?.releaseDate ?? null,
  });
  anyExisting ||= albumRes.wasExisting;

  const songRes = await getOrCreateSongByDeezer({
    deezerTrack: params.deezerTrack,
    albumId: albumRes.id,
    artistIdsOrdered: artistIds,
    titleOverride: params.overrides?.songTitle ?? null,
    coverUrlOverride: params.overrides?.coverUrl ?? null,
    releaseDateOverride: params.overrides?.releaseDate ?? null,
  });
  anyExisting ||= songRes.wasExisting;

  const platformId = await ensureDeezerPlatform();
  const songUrl = params.deezerTrack.link ?? null;
  const albumUrl = params.deezerTrack.album?.link ?? null;

  if (songUrl) {
    await upsertSongStreamingLink(songRes.id, { platform_id: platformId, url: songUrl });
  }

  if (albumUrl) {
    const { error } = await supabase
      .from("album_streaming_links")
      .upsert({ album_id: albumRes.id, platform_id: platformId, url: albumUrl }, { onConflict: "album_id,platform_id" });
    if (error) throw error;
  }

  return { artistIds, albumId: albumRes.id, songId: songRes.id, wasExisting: anyExisting } as ImportResult;
}

export async function importDeezerArtist(params: { deezerArtist: any; overrides?: { name?: string; pictureUrl?: string } }) {
  const externalId = String(params.deezerArtist.id);
  const linked = await getLocalIdByExternalId({ provider: "deezer", entityType: "artists", externalId });
  if (linked) return { artistIds: [linked], albumId: null, songId: null, wasExisting: true } as ImportResult;

  const name = (params.overrides?.name ?? params.deezerArtist.name ?? "").toString().trim();
  const profile = urlImage(params.overrides?.pictureUrl ?? params.deezerArtist.picture_xl ?? params.deezerArtist.picture_medium ?? null);
  const { data, error } = await supabase
    .from("artists")
    .upsert({ name, bio: null, profile_image: profile }, { onConflict: "name" })
    .select("id")
    .single();
  if (error) throw error;
  await linkExternalId({ provider: "deezer", entityType: "artists", externalId, localId: data.id as string });
  return { artistIds: [data.id as string], albumId: null, songId: null, wasExisting: false } as ImportResult;
}

export async function importDeezerAlbum(params: {
  deezerAlbum: any;
  albumDetails: any;
  overrides?: { title?: string; coverUrl?: string; releaseDate?: string };
  importTracks?: boolean;
}) {
  const albumExternalId = String(params.deezerAlbum.id);
  const linked = await getLocalIdByExternalId({ provider: "deezer", entityType: "albums", externalId: albumExternalId });
  if (linked) return { artistIds: [], albumId: linked, songId: null, wasExisting: true } as ImportResult;

  const contributors = params.albumDetails?.contributors?.length ? params.albumDetails.contributors : params.albumDetails?.artist ? [params.albumDetails.artist] : params.deezerAlbum.artist ? [params.deezerAlbum.artist] : [];
  const artistIds: string[] = [];
  for (const a of contributors) {
    const { id } = await getOrCreateArtistByDeezer({ deezerArtist: a });
    artistIds.push(id);
  }

  const albumRes = await getOrCreateAlbumByDeezer({
    deezerAlbum: { ...params.deezerAlbum, release_date: params.albumDetails?.release_date ?? params.deezerAlbum.release_date },
    artistIdsOrdered: artistIds,
    titleOverride: params.overrides?.title ?? null,
    coverUrlOverride: params.overrides?.coverUrl ?? null,
    releaseDateOverride: params.overrides?.releaseDate ?? null,
  });

  const platformId = await ensureDeezerPlatform();
  const albumUrl = params.albumDetails?.link ?? params.deezerAlbum.link ?? null;
  if (albumUrl) {
    const { error } = await supabase
      .from("album_streaming_links")
      .upsert({ album_id: albumRes.id, platform_id: platformId, url: albumUrl }, { onConflict: "album_id,platform_id" });
    if (error) throw error;
  }

  if (params.importTracks) {
    const tracks: any[] = params.albumDetails?.tracks?.data ?? [];
    // lightweight import without extra API calls
    for (const t of tracks) {
      const trackContrib = (t.contributors ?? []).length ? t.contributors : t.artist ? [t.artist] : contributors;
      const trackArtistIds: string[] = [];
      for (const a of trackContrib ?? []) {
        const { id } = await getOrCreateArtistByDeezer({ deezerArtist: a });
        trackArtistIds.push(id);
      }
      const trackLike = {
        id: t.id,
        title: t.title,
        duration: t.duration,
        preview: t.preview,
        link: t.link,
        artist: toOne(t.artist) ?? params.albumDetails.artist,
        contributors: t.contributors ?? params.albumDetails.contributors,
        album: { id: params.deezerAlbum.id, title: params.deezerAlbum.title, cover_xl: params.deezerAlbum.cover_xl, cover_medium: params.deezerAlbum.cover_medium, cover: params.deezerAlbum.cover, link: albumUrl, release_date: params.albumDetails.release_date },
      };
      const res = await getOrCreateSongByDeezer({
        deezerTrack: trackLike,
        albumId: albumRes.id,
        artistIdsOrdered: trackArtistIds.length ? trackArtistIds : artistIds.length ? artistIds : [],
        titleOverride: null,
        coverUrlOverride: params.overrides?.coverUrl ?? null,
        releaseDateOverride: params.overrides?.releaseDate ?? null,
      });
      if (trackLike.link) {
        await upsertSongStreamingLink(res.id, { platform_id: platformId, url: trackLike.link });
      }
    }
  }

  return { artistIds, albumId: albumRes.id, songId: null, wasExisting: false } as ImportResult;
}

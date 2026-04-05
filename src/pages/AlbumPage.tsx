import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ResolvedImage } from "@/components/ResolvedImage";
import { StreamingButtons } from "@/components/StreamingButtons";
import { getAlbum, listAlbumSongs, listAlbumStreamingLinks } from "@/services/music/albums";

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AlbumPage() {
  const { albumId } = useParams();
  if (!albumId) return null;

  const albumQuery = useQuery({ queryKey: ["album", albumId], queryFn: () => getAlbum(albumId) });
  const songsQuery = useQuery({
    enabled: Boolean(albumId),
    queryKey: ["albumSongs", albumId],
    queryFn: () => listAlbumSongs(albumId),
  });
  const linksQuery = useQuery({
    enabled: Boolean(albumId),
    queryKey: ["albumLinks", albumId],
    queryFn: () => listAlbumStreamingLinks(albumId),
  });

  if (albumQuery.isLoading) return <Skeleton className="h-64 w-full rounded-3xl" />;
  if (albumQuery.error) {
    return (
      <Card className="p-6">
        <div className="text-sm text-[rgb(var(--muted))]">Album not found.</div>
      </Card>
    );
  }

  const album = albumQuery.data as any;
  const albumArtists = (album.album_artists ?? [])
    .slice()
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    .map((aa: any) => aa.artist)
    .filter(Boolean);
  const displayArtists = albumArtists.length ? albumArtists : album.artist ? [album.artist] : [];
  const links = (linksQuery.data ?? []).map((l: any) => ({ url: l.url, platform: l.platform }));
  const songs = songsQuery.data ?? [];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr] md:items-end">
        <div className="aspect-square overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
          <ResolvedImage image={album.cover_image} alt={album.title} className="h-full w-full" fallbackClassName="h-full w-full" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
            Album
          </div>
          <h1 className="mt-2 line-clamp-2 text-3xl font-semibold">{album.title}</h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[rgb(var(--muted))]">
            {displayArtists.length ? (
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                {displayArtists.map((a: any, idx: number) => (
                  <React.Fragment key={a.id}>
                    <Link to={`/artists/${a.id}`} className="underline">
                      {a.name}
                    </Link>
                    {idx < displayArtists.length - 1 ? (
                      <span className="text-[rgb(var(--muted))]">·</span>
                    ) : null}
                  </React.Fragment>
                ))}
              </span>
            ) : null}
            {album.release_date ? <span>{album.release_date}</span> : null}
            <span>{songs.length} tracks</span>
          </div>
          <div className="mt-5">
            <StreamingButtons links={links} />
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tracklist</h2>
        <div className="space-y-2">
          {songsQuery.isLoading ? (
            <Skeleton className="h-24 w-full rounded-2xl" />
          ) : (
            songs.map((s: any, idx: number) => (
              <Link key={s.id} to={`/songs/${s.id}`} className="block">
                <Card className="flex items-center gap-3 p-3 hover:bg-black/5 dark:hover:bg-white/5">
                  <div className="w-8 text-center text-sm font-semibold text-[rgb(var(--muted))]">
                    {idx + 1}
                  </div>
                  <div className="h-12 w-12 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-black/5">
                    <ResolvedImage image={s.cover_image} alt={s.title} className="h-full w-full" fallbackClassName="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-sm font-semibold">{s.title}</div>
                    <div className="mt-0.5 text-xs text-[rgb(var(--muted))]">{formatDuration(s.duration)}</div>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))]">
                    <Play className="h-4 w-4" />
                  </span>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock3, Play, Share2 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ResolvedImage } from "@/components/ResolvedImage";
import { StreamingButtons } from "@/components/StreamingButtons";
import { FavoriteButton } from "@/components/FavoriteButton";
import { listSongArtists, listSongStreamingLinks, getSong } from "@/services/music/songs";
import { listAlbumSongs } from "@/services/music/albums";
import { usePlayer } from "@/store/player/PlayerProvider";

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SongPage() {
  const { songId } = useParams();
  if (!songId) return null;
  const player = usePlayer();

  const songQuery = useQuery({ queryKey: ["song", songId], queryFn: () => getSong(songId) });
  const artistsQuery = useQuery({
    enabled: Boolean(songId),
    queryKey: ["songArtists", songId],
    queryFn: () => listSongArtists(songId),
  });
  const linksQuery = useQuery({
    enabled: Boolean(songId),
    queryKey: ["songLinks", songId],
    queryFn: () => listSongStreamingLinks(songId),
  });
  const relatedQuery = useQuery({
    enabled: Boolean(songQuery.data?.album?.id),
    queryKey: ["albumSongs", songQuery.data?.album?.id],
    queryFn: () => listAlbumSongs(songQuery.data.album.id),
  });

  if (songQuery.isLoading) return <Skeleton className="h-64 w-full rounded-3xl" />;
  if (songQuery.error) {
    return (
      <Card className="p-6">
        <div className="text-sm text-[rgb(var(--muted))]">Song not found.</div>
      </Card>
    );
  }

  const song = songQuery.data as any;
  const artists = artistsQuery.data ?? [];
  const links = (linksQuery.data ?? []).map((l: any) => ({ url: l.url, platform: l.platform }));
  const related = (relatedQuery.data ?? []).filter((s: any) => s.id !== song.id).slice(0, 12);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr] md:items-end">
        <div className="aspect-square overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
          <ResolvedImage image={song.cover_image ?? song.album?.cover_image} alt={song.title} className="h-full w-full" fallbackClassName="h-full w-full" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
            Song
          </div>
          <h1 className="mt-2 line-clamp-2 text-3xl font-semibold">{song.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[rgb(var(--muted))]">
            {song.album?.id ? (
              <Link to={`/albums/${song.album.id}`} className="underline">
                {song.album.title}
              </Link>
            ) : (
              <span>Single</span>
            )}
            {song.duration ? (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-4 w-4" /> {formatDuration(song.duration)}
              </span>
            ) : null}
          </div>
          {artists.length ? (
            <div className="mt-3 text-sm">
              <span className="text-[rgb(var(--muted))]">Artists: </span>
              {artists.map((a: any, idx: number) => (
                <React.Fragment key={a.artist.id}>
                  <Link to={`/artists/${a.artist.id}`} className="underline">
                    {a.artist.name}
                  </Link>
                  {a.role ? <span className="text-[rgb(var(--muted))]"> ({a.role})</span> : null}
                  {idx < artists.length - 1 ? <span className="text-[rgb(var(--muted))]"> · </span> : null}
                </React.Fragment>
              ))}
            </div>
          ) : null}
          <div className="mt-5">
            <StreamingButtons links={links} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => player.playSongId(song.id)}
              disabled={!song.preview_url}
              title={song.preview_url ? "Play 30s preview" : "No preview URL"}
            >
              <Play className="h-4 w-4" />
              Play preview
            </Button>
            <FavoriteButton entityType="songs" entityId={song.id} />
            <Button
              variant="secondary"
              size="md"
              onClick={async () => {
                const url = window.location.href;
                const nav: any = navigator;
                try {
                  if (nav.share) await nav.share({ title: song.title, url });
                  else if (nav.clipboard?.writeText) await nav.clipboard.writeText(url);
                  else alert(url);
                } catch {
                  if (nav.clipboard?.writeText) await nav.clipboard.writeText(url);
                  else alert(url);
                }
              }}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {song.lyrics ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Lyrics</h2>
          <Card className="p-5">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[rgb(var(--fg))]">{song.lyrics}</pre>
          </Card>
        </section>
      ) : null}

      {related.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Related songs</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((s: any) => (
              <Link key={s.id} to={`/songs/${s.id}`} className="focus-ring rounded-2xl">
                <Card className="flex items-center gap-3 p-3 hover:bg-black/5 dark:hover:bg-white/5">
                  <div className="h-12 w-12 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-black/5">
                    <ResolvedImage image={s.cover_image} alt={s.title} className="h-full w-full" fallbackClassName="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-sm font-semibold">{s.title}</div>
                    <div className="mt-0.5 text-xs text-[rgb(var(--muted))]">{formatDuration(s.duration) ?? "—"}</div>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))]">
                    <Play className="h-4 w-4" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

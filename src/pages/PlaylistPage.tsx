import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ResolvedImage } from "@/components/ResolvedImage";
import { getPlaylist, listPlaylistSongs } from "@/services/music/playlists";
import { usePlayer } from "@/store/player/PlayerProvider";

export default function PlaylistPage() {
  const { playlistId } = useParams();
  if (!playlistId) return null;
  const player = usePlayer();

  const playlistQuery = useQuery({
    queryKey: ["playlist", playlistId],
    queryFn: () => getPlaylist(playlistId),
  });
  const songsQuery = useQuery({
    enabled: Boolean(playlistId),
    queryKey: ["playlistSongs", playlistId],
    queryFn: () => listPlaylistSongs(playlistId),
  });

  if (playlistQuery.isLoading) return <Skeleton className="h-64 w-full rounded-3xl" />;
  if (playlistQuery.error) {
    return (
      <Card className="p-6">
        <div className="text-sm text-[rgb(var(--muted))]">Playlist not found.</div>
      </Card>
    );
  }

  const playlist = playlistQuery.data as any;
  const items = songsQuery.data ?? [];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr] md:items-end">
        <div className="aspect-square overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
          <ResolvedImage image={playlist.cover_image} alt={playlist.title} className="h-full w-full" fallbackClassName="h-full w-full" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
            Playlist
          </div>
          <h1 className="mt-2 line-clamp-2 text-3xl font-semibold">{playlist.title}</h1>
          {playlist.description ? (
            <p className="mt-3 max-w-2xl text-sm text-[rgb(var(--muted))]">{playlist.description}</p>
          ) : null}
          <div className="mt-3 text-sm text-[rgb(var(--muted))]">{items.length} songs</div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Songs</h2>
        <div className="space-y-2">
          {songsQuery.isLoading ? (
            <Skeleton className="h-24 w-full rounded-2xl" />
          ) : (
            items.map((r: any, idx: number) => (
              <Link key={r.song.id} to={`/songs/${r.song.id}`} className="block">
                <Card className="flex items-center gap-3 p-3 hover:bg-black/5 dark:hover:bg-white/5">
                  <div className="w-8 text-center text-sm font-semibold text-[rgb(var(--muted))]">
                    {idx + 1}
                  </div>
                  <div className="h-12 w-12 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-black/5">
                    <ResolvedImage image={r.song.cover_image} alt={r.song.title} className="h-full w-full" fallbackClassName="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-sm font-semibold">{r.song.title}</div>
                    <div className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                      {r.song.album?.artist?.name ?? r.song.album?.title ?? "Song"}
                    </div>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))]">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        player.playSongId(r.song.id);
                      }}
                      disabled={!r.song.preview_url}
                      aria-label="Play preview"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
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

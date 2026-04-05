import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ResolvedImage } from "@/components/ResolvedImage";
import { MediaCard } from "@/components/MediaCard";
import { getArtist, listArtistAlbums, listArtistTopSongs } from "@/services/music/artists";

export default function ArtistPage() {
  const { artistId } = useParams();
  if (!artistId) return null;

  const artistQuery = useQuery({ queryKey: ["artist", artistId], queryFn: () => getArtist(artistId) });
  const albumsQuery = useQuery({
    enabled: Boolean(artistId),
    queryKey: ["artistAlbums", artistId],
    queryFn: () => listArtistAlbums(artistId),
  });
  const topSongsQuery = useQuery({
    enabled: Boolean(artistId),
    queryKey: ["artistTopSongs", artistId],
    queryFn: () => listArtistTopSongs(artistId, 12),
  });

  if (artistQuery.isLoading) return <Skeleton className="h-64 w-full rounded-3xl" />;
  if (artistQuery.error) {
    return (
      <Card className="p-6">
        <div className="text-sm text-[rgb(var(--muted))]">Artist not found.</div>
      </Card>
    );
  }

  const artist = artistQuery.data as any;

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="absolute inset-0 opacity-70">
          <ResolvedImage image={artist.profile_image} alt={artist.name} className="h-full w-full blur-[2px] scale-105" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
        <div className="relative grid gap-6 p-6 md:grid-cols-[180px_1fr] md:items-end md:p-10">
          <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <ResolvedImage image={artist.profile_image} alt={artist.name} className="h-full w-full" fallbackClassName="h-full w-full" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/70">Artist</div>
            <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">{artist.name}</h1>
            {artist.bio ? <p className="mt-3 max-w-2xl text-sm text-white/70">{artist.bio}</p> : null}
          </div>
        </div>
      </div>

      {topSongsQuery.data?.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Top songs</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topSongsQuery.data.map((s: any) => (
              <Link key={s.id} to={`/songs/${s.id}`} className="block">
                <Card className="flex items-center gap-3 p-3 hover:bg-black/5 dark:hover:bg-white/5">
                  <div className="h-12 w-12 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-black/5">
                    <ResolvedImage image={s.cover_image} alt={s.title} className="h-full w-full" fallbackClassName="h-full w-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-sm font-semibold">{s.title}</div>
                    <div className="mt-0.5 text-xs text-[rgb(var(--muted))]">{s.album?.title ?? "Song"}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {albumsQuery.data?.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Albums</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {albumsQuery.data.map((a: any) => (
              <MediaCard key={a.id} kind="album" item={a} subtitle={a.release_date ?? "Album"} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

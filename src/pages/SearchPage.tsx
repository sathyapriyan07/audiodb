import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/utils/cn";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { searchAll } from "@/services/search/search";
import { MediaCard } from "@/components/MediaCard";

type Tab = "all" | "songs" | "albums" | "artists" | "playlists";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "all", label: "All" },
  { id: "songs", label: "Songs" },
  { id: "albums", label: "Albums" },
  { id: "artists", label: "Artists" },
  { id: "playlists", label: "Playlists" },
];

export default function SearchPage() {
  const [q, setQ] = React.useState("");
  const [tab, setTab] = React.useState<Tab>("all");
  const dq = useDebouncedValue(q, 200);

  const resultsQuery = useQuery({
    queryKey: ["searchAll", dq],
    queryFn: () => searchAll(dq, 12),
  });

  const r = resultsQuery.data;
  const hasAny =
    (r?.songs.length ?? 0) + (r?.albums.length ?? 0) + (r?.artists.length ?? 0) + (r?.playlists.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Search</h1>
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search songs, albums, artists, playlists…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "focus-ring rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-sm font-medium",
                tab === t.id
                  ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))] dark:bg-white dark:text-slate-900"
                  : "bg-[rgb(var(--card))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {resultsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : resultsQuery.error ? (
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-sm text-[rgb(var(--muted))]">
          Failed to search.
        </div>
      ) : !dq.trim() ? (
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-sm text-[rgb(var(--muted))]">
          Start typing to search across the catalog.
        </div>
      ) : !hasAny ? (
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-sm text-[rgb(var(--muted))]">
          No results for <span className="font-semibold text-[rgb(var(--fg))]">{dq}</span>.
        </div>
      ) : (
        <div className="space-y-8">
          {(tab === "all" || tab === "songs") && r?.songs.length ? (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <h2 className="text-lg font-semibold">Songs</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {r.songs.map((s: any) => (
                  <MediaCard
                    key={s.id}
                    kind="song"
                    item={s}
                    subtitle={s.album?.title ?? "Song"}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {(tab === "all" || tab === "albums") && r?.albums.length ? (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <h2 className="text-lg font-semibold">Albums</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {r.albums.map((a: any) => (
                  <MediaCard
                    key={a.id}
                    kind="album"
                    item={a}
                    subtitle={
                      a.album_artists?.[0]?.artist?.name ??
                      a.artist?.name ??
                      (a.album_artists?.length ? "Various artists" : "Album")
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}

          {(tab === "all" || tab === "artists") && r?.artists.length ? (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <h2 className="text-lg font-semibold">Artists</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {r.artists.map((a: any) => (
                  <MediaCard key={a.id} kind="artist" item={a} subtitle="Artist" />
                ))}
              </div>
            </section>
          ) : null}

          {(tab === "all" || tab === "playlists") && r?.playlists.length ? (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <h2 className="text-lg font-semibold">Playlists</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {r.playlists.map((p: any) => (
                  <MediaCard key={p.id} kind="playlist" item={p} subtitle="Playlist" />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <div className="text-xs text-[rgb(var(--muted))]">
        Tip: Admins can curate homepage sections in{" "}
        <Link to="/admin" className="underline">
          Admin
        </Link>
        .
      </div>
    </div>
  );
}

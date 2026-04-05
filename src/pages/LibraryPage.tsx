import React from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "@/services/auth/AuthProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { MediaCard } from "@/components/MediaCard";
import { listFavoriteEntities } from "@/services/user/favorites";
import { listUserPlaylists, createUserPlaylist } from "@/services/user/playlists";
import { listRecentlyPlayed } from "@/services/user/history";
import { queryClient } from "@/services/queryClient";
import { toErrorMessage } from "@/services/db/errors";

type Tab = "songs" | "albums" | "artists";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "songs", label: "Tracks" },
  { id: "albums", label: "Albums" },
  { id: "artists", label: "Artists" },
];

const playlistSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().or(z.literal("")),
});

export default function LibraryPage() {
  const { user, isLoading } = useAuth();
  const [tab, setTab] = React.useState<Tab>("songs");
  const [createOpen, setCreateOpen] = React.useState(false);

  const favQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ["favorites", tab],
    queryFn: () => listFavoriteEntities(tab, 48),
  });

  const playlistsQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ["userPlaylists"],
    queryFn: listUserPlaylists,
  });

  const recentQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ["recentlyPlayed"],
    queryFn: () => listRecentlyPlayed(18),
  });

  const form = useForm<z.infer<typeof playlistSchema>>({
    resolver: zodResolver(playlistSchema),
    defaultValues: { title: "", description: "" },
  });

  const createMutation = useMutation({
    mutationFn: (values: z.infer<typeof playlistSchema>) =>
      createUserPlaylist({ title: values.title, description: values.description ? values.description : null, cover_image: null }),
    onSuccess: async (p) => {
      await queryClient.invalidateQueries({ queryKey: ["userPlaylists"] });
      setCreateOpen(false);
      form.reset({ title: "", description: "" });
      // optional: navigate later to playlist details page when implemented
      alert(`Created playlist: ${p.title}`);
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full rounded-2xl" />;

  if (!user) {
    return (
      <Card className="p-8">
        <h1 className="text-2xl font-semibold">Your Library</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Sign in to save favorites, build playlists, and keep your recently played.
        </p>
        <div className="mt-6">
          <Link to="/login" state={{ from: "/library" }}>
            <Button variant="primary">Sign in</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const favItems = (favQuery.data ?? []) as any[];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Library</h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">Favorites, playlists, and recently played.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New playlist
        </Button>
      </div>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold">Favorites</h2>
          <div className="flex gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={
                  "focus-ring rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-sm font-medium " +
                  (tab === t.id
                    ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))] dark:bg-white dark:text-slate-900"
                    : "bg-[rgb(var(--card))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {favQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : favQuery.error ? (
          <Card className="p-6">
            <div className="text-sm text-red-600">{toErrorMessage(favQuery.error)}</div>
          </Card>
        ) : favItems.length === 0 ? (
          <Card className="p-6">
            <div className="text-sm text-[rgb(var(--muted))]">No favorites yet.</div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {favItems.map((it) => (
              <MediaCard
                key={it.id}
                kind={tab === "songs" ? "song" : tab === "albums" ? "album" : "artist"}
                item={it}
                subtitle={
                  tab === "songs"
                    ? it.album?.artist?.name ?? it.album?.title ?? "Song"
                    : tab === "albums"
                      ? it.album_artists?.[0]?.artist?.name ?? "Album"
                      : "Artist"
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Playlists</h2>
        {playlistsQuery.isLoading ? (
          <Skeleton className="h-28 w-full rounded-2xl" />
        ) : playlistsQuery.error ? (
          <Card className="p-6">
            <div className="text-sm text-red-600">{toErrorMessage(playlistsQuery.error)}</div>
          </Card>
        ) : playlistsQuery.data?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {playlistsQuery.data.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="text-sm font-semibold">{p.title}</div>
                <div className="mt-1 line-clamp-2 text-xs text-[rgb(var(--muted))]">{p.description ?? "—"}</div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6">
            <div className="text-sm text-[rgb(var(--muted))]">No playlists yet.</div>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recently played</h2>
        {recentQuery.isLoading ? (
          <Skeleton className="h-28 w-full rounded-2xl" />
        ) : recentQuery.error ? (
          <Card className="p-6">
            <div className="text-sm text-red-600">{toErrorMessage(recentQuery.error)}</div>
          </Card>
        ) : recentQuery.data?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentQuery.data.map((r: any) => (
              <MediaCard
                key={r.song.id + r.played_at}
                kind="song"
                item={r.song}
                subtitle={r.song.album?.artist?.name ?? r.song.album?.title ?? "Song"}
              />
            ))}
          </div>
        ) : (
          <Card className="p-6">
            <div className="text-sm text-[rgb(var(--muted))]">Nothing yet. Play a preview to start.</div>
          </Card>
        )}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New playlist">
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
        >
          <div className="space-y-1.5">
            <div className="text-sm font-medium">Title</div>
            <Input {...form.register("title")} placeholder="My favorites" />
          </div>
          <div className="space-y-1.5">
            <div className="text-sm font-medium">Description</div>
            <Textarea {...form.register("description")} placeholder="Mood, theme…" />
          </div>
          {createMutation.error ? (
            <div className="text-sm text-red-600">{toErrorMessage(createMutation.error)}</div>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


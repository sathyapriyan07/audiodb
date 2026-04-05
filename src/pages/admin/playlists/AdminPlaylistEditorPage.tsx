import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageField } from "@/components/admin/ImageField";
import { SortableIdList, type SortableItem } from "@/components/admin/SortableIdList";

import { listSongs } from "@/services/music/songs";
import { getPlaylist, listPlaylistSongs, setPlaylistSongs, upsertPlaylist } from "@/services/music/playlists";
import { queryClient } from "@/services/queryClient";
import { toErrorMessage } from "@/services/db/errors";
import type { ImageRef } from "@/types/media";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().or(z.literal("")),
  cover_image: z.custom<ImageRef | null>(),
  song_ids: z.array(z.string().uuid()),
});

type FormValues = z.infer<typeof schema>;

export default function AdminPlaylistEditorPage() {
  const { playlistId } = useParams();
  const isNew = !playlistId || playlistId === "new";
  const navigate = useNavigate();

  const existing = useQuery({
    enabled: !isNew,
    queryKey: ["playlist", playlistId],
    queryFn: () => getPlaylist(playlistId!),
  });
  const existingSongs = useQuery({
    enabled: !isNew,
    queryKey: ["playlistSongs", playlistId],
    queryFn: () => listPlaylistSongs(playlistId!),
  });

  const songsCatalog = useQuery({
    queryKey: ["songs", ""],
    queryFn: () => listSongs({ limit: 500, offset: 0 }),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: existing.data
      ? {
          title: existing.data.title,
          description: existing.data.description ?? "",
          cover_image: existing.data.cover_image ?? null,
          song_ids: (existingSongs.data ?? []).map((r: any) => r.song_id),
        }
      : { title: "", description: "", cover_image: null, song_ids: [] },
  });

  const [pendingAddSongId, setPendingAddSongId] = React.useState("");
  const songIds = useWatch({ control: form.control, name: "song_ids" }) ?? [];

  const items: SortableItem[] = React.useMemo(() => {
    const map = new Map((songsCatalog.data ?? []).map((s) => [s.id, s]));
    return songIds.map((id) => {
      const s: any = map.get(id);
      return { id, label: s?.title ?? id, subtitle: s?.album?.title ?? null };
    });
  }, [songIds, songsCatalog.data]);

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      const playlist = await upsertPlaylist({
        id: isNew ? undefined : playlistId,
        title: values.title,
        description: values.description ? values.description : null,
        cover_image: (values.cover_image as any) ?? null,
      });
      await setPlaylistSongs(playlist.id, values.song_ids);
      return playlist;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["playlists"] }),
        queryClient.invalidateQueries({ queryKey: ["playlist", data.id] }),
        queryClient.invalidateQueries({ queryKey: ["playlistSongs", data.id] }),
      ]);
      navigate(`/admin/playlists/${data.id}`, { replace: true });
    },
  });

  const isLoading = (!isNew && existing.isLoading) || songsCatalog.isLoading;

  return (
    <div>
      <AdminHeader title={isNew ? "New playlist" : "Edit playlist"} actionHref="/admin/playlists" actionLabel="Back" />

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : existing.error ? (
        <Card className="p-6">
          <div className="text-sm text-[rgb(var(--muted))]">{toErrorMessage(existing.error)}</div>
        </Card>
      ) : (
        <Card className="p-6">
          <form className="space-y-5" onSubmit={form.handleSubmit((values) => save.mutate(values))}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input {...form.register("title")} placeholder="Playlist title" />
              </div>
              <div />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea {...form.register("description")} placeholder="Mood, theme…" />
            </div>

            <ImageField control={form.control} name={"cover_image"} label="Cover image" folder="playlists" />

            <div className="space-y-2">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <Label hint="Drag to reorder">Songs</Label>
                <div className="flex gap-2">
                  <select
                    className="focus-ring h-10 w-full min-w-[220px] rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm"
                    value={pendingAddSongId}
                    onChange={(e) => setPendingAddSongId(e.target.value)}
                  >
                    <option value="">Add song…</option>
                    {(songsCatalog.data ?? []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!pendingAddSongId) return;
                      const curr = form.getValues("song_ids") ?? [];
                      if (curr.includes(pendingAddSongId)) return;
                      form.setValue("song_ids", [...curr, pendingAddSongId], { shouldDirty: true });
                      setPendingAddSongId("");
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {items.length ? (
                <SortableIdList
                  items={items}
                  onChange={(next) => form.setValue("song_ids", next.map((i) => i.id), { shouldDirty: true })}
                  onRemove={(id) =>
                    form.setValue(
                      "song_ids",
                      (form.getValues("song_ids") ?? []).filter((x) => x !== id),
                      { shouldDirty: true },
                    )
                  }
                />
              ) : (
                <div className="text-sm text-[rgb(var(--muted))]">No songs in this playlist yet.</div>
              )}
            </div>

            {save.error ? <div className="text-sm text-red-600">{toErrorMessage(save.error)}</div> : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
              <Link to="/admin/playlists">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

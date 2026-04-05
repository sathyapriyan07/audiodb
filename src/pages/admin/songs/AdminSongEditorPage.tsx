import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
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
import { ArtistRolesEditor } from "@/components/admin/ArtistRolesEditor";
import { StreamingLinksEditor } from "@/components/admin/StreamingLinksEditor";

import { listArtists } from "@/services/music/artists";
import { listAlbums } from "@/services/music/albums";
import { listPlatforms } from "@/services/music/platforms";
import {
  getSong,
  listSongArtists,
  listSongStreamingLinks,
  setSongArtists,
  setSongStreamingLinks,
  upsertSong,
} from "@/services/music/songs";
import { queryClient } from "@/services/queryClient";
import { toErrorMessage } from "@/services/db/errors";
import type { ImageRef } from "@/types/media";

const schema = z.object({
  title: z.string().min(1),
  duration: z
    .union([z.number().int().positive(), z.nan(), z.null()])
    .transform((v) => (typeof v === "number" && !Number.isNaN(v) ? v : null)),
  release_date: z.string().nullable().or(z.literal("")),
  album_id: z.string().uuid().nullable().or(z.literal("")),
  cover_image: z.custom<ImageRef | null>(),
  preview_url: z.string().url().nullable().or(z.literal("")),
  lyrics: z.string().nullable().or(z.literal("")),
  artists: z.array(z.object({ artist_id: z.string().uuid(), role: z.string().nullable().or(z.literal("")) })),
  streaming_links: z.array(z.object({ platform_id: z.string().uuid(), url: z.string().url() })),
});

type FormValues = z.infer<typeof schema>;

export default function AdminSongEditorPage() {
  const { songId } = useParams();
  const isNew = !songId || songId === "new";
  const navigate = useNavigate();

  const artistsQuery = useQuery({ queryKey: ["artists", ""], queryFn: () => listArtists({ limit: 500, offset: 0 }) });
  const albumsQuery = useQuery({ queryKey: ["albums", ""], queryFn: () => listAlbums({ limit: 500, offset: 0 }) });
  const platformsQuery = useQuery({ queryKey: ["platforms"], queryFn: listPlatforms });

  const existing = useQuery({
    enabled: !isNew,
    queryKey: ["song", songId],
    queryFn: () => getSong(songId!),
  });

  const existingArtists = useQuery({
    enabled: !isNew,
    queryKey: ["songArtists", songId],
    queryFn: () => listSongArtists(songId!),
  });

  const existingLinks = useQuery({
    enabled: !isNew,
    queryKey: ["songLinks", songId],
    queryFn: () => listSongStreamingLinks(songId!),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: existing.data
      ? {
          title: existing.data.title,
          duration: existing.data.duration ?? null,
          release_date: existing.data.release_date ?? "",
          album_id: existing.data.album_id ?? "",
          cover_image: existing.data.cover_image ?? null,
          preview_url: existing.data.preview_url ?? "",
          lyrics: existing.data.lyrics ?? "",
          artists: (existingArtists.data ?? []).map((a: any) => ({
            artist_id: a.artist_id,
            role: a.role ?? "",
          })),
          streaming_links: (existingLinks.data ?? []).map((l: any) => ({ platform_id: l.platform_id, url: l.url })),
        }
      : {
          title: "",
          duration: null,
          release_date: "",
          album_id: "",
          cover_image: null,
          preview_url: "",
          lyrics: "",
          artists: [],
          streaming_links: [],
        },
  });

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      const song = await upsertSong({
        id: isNew ? undefined : songId,
        title: values.title,
        duration: values.duration,
        release_date: values.release_date ? values.release_date : null,
        album_id: values.album_id ? values.album_id : null,
        cover_image: (values.cover_image as any) ?? null,
        preview_url: values.preview_url ? values.preview_url : null,
        lyrics: values.lyrics ? values.lyrics : null,
      });
      await setSongArtists(
        song.id,
        values.artists.map((a) => ({ artist_id: a.artist_id, role: a.role ? a.role : null })),
      );
      await setSongStreamingLinks(song.id, values.streaming_links);
      return song;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["songs"] }),
        queryClient.invalidateQueries({ queryKey: ["song", data.id] }),
        queryClient.invalidateQueries({ queryKey: ["songArtists", data.id] }),
        queryClient.invalidateQueries({ queryKey: ["songLinks", data.id] }),
      ]);
      navigate(`/admin/songs/${data.id}`, { replace: true });
    },
  });

  const isLoading =
    (!isNew && existing.isLoading) || artistsQuery.isLoading || albumsQuery.isLoading || platformsQuery.isLoading;

  return (
    <div>
      <AdminHeader title={isNew ? "New song" : "Edit song"} actionHref="/admin/songs" actionLabel="Back" />

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
                <Input {...form.register("title")} placeholder="Song title" />
              </div>
              <div className="space-y-1.5">
                <Label>Album</Label>
                <select
                  className="focus-ring h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm"
                  {...form.register("album_id")}
                >
                  <option value="">Single / none</option>
                  {(albumsQuery.data ?? []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} {a.artist?.name ? `— ${a.artist.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label hint="Seconds">Duration</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.watch("duration") ?? ""}
                  onChange={(e) =>
                    form.setValue("duration", e.target.value ? Number(e.target.value) : (null as any))
                  }
                  placeholder="210"
                />
              </div>
              <div className="space-y-1.5">
                <Label hint="YYYY-MM-DD">Release date</Label>
                <Input {...form.register("release_date")} placeholder="2026-01-01" />
              </div>
            </div>

            <ImageField control={form.control} name={"cover_image"} label="Cover image" folder="songs" />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label hint="Deezer 30s MP3 URL">Preview URL</Label>
                <Input {...form.register("preview_url")} placeholder="https://…/preview.mp3" />
              </div>
              <div />
            </div>

            <div className="space-y-1.5">
              <Label hint="Optional">Lyrics</Label>
              <Textarea {...form.register("lyrics")} placeholder="Paste lyrics…" />
            </div>

            <ArtistRolesEditor control={form.control} name={"artists"} artists={artistsQuery.data ?? []} />

            <StreamingLinksEditor
              control={form.control}
              name={"streaming_links"}
              platforms={platformsQuery.data ?? []}
              label="Song streaming links"
            />

            {save.error ? <div className="text-sm text-red-600">{toErrorMessage(save.error)}</div> : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
              <Link to="/admin/songs">
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

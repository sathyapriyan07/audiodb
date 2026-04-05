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
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageField } from "@/components/admin/ImageField";
import { StreamingLinksEditor } from "@/components/admin/StreamingLinksEditor";

import { listArtists } from "@/services/music/artists";
import { listPlatforms } from "@/services/music/platforms";
import { getAlbum, listAlbumStreamingLinks, setAlbumStreamingLinks, upsertAlbum } from "@/services/music/albums";
import { queryClient } from "@/services/queryClient";
import { toErrorMessage } from "@/services/db/errors";
import type { ImageRef } from "@/types/media";

const schema = z.object({
  title: z.string().min(1),
  artist_id: z.string().uuid(),
  release_date: z.string().nullable().or(z.literal("")),
  cover_image: z.custom<ImageRef | null>(),
  streaming_links: z.array(
    z.object({
      platform_id: z.string().uuid(),
      url: z.string().url(),
    }),
  ),
});

type FormValues = z.infer<typeof schema>;

export default function AdminAlbumEditorPage() {
  const { albumId } = useParams();
  const isNew = !albumId || albumId === "new";
  const navigate = useNavigate();

  const artistsQuery = useQuery({ queryKey: ["artists", ""], queryFn: () => listArtists({ limit: 500, offset: 0 }) });
  const platformsQuery = useQuery({ queryKey: ["platforms"], queryFn: listPlatforms });

  const existing = useQuery({
    enabled: !isNew,
    queryKey: ["album", albumId],
    queryFn: () => getAlbum(albumId!),
  });

  const existingLinks = useQuery({
    enabled: !isNew,
    queryKey: ["albumLinks", albumId],
    queryFn: () => listAlbumStreamingLinks(albumId!),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: existing.data
      ? {
          title: existing.data.title,
          artist_id: existing.data.artist_id,
          release_date: existing.data.release_date ?? "",
          cover_image: existing.data.cover_image ?? null,
          streaming_links: (existingLinks.data ?? []).map((l: any) => ({ platform_id: l.platform.id, url: l.url })),
        }
      : { title: "", artist_id: "", release_date: "", cover_image: null, streaming_links: [] },
  });

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      const album = await upsertAlbum({
        id: isNew ? undefined : albumId,
        title: values.title,
        artist_id: values.artist_id,
        release_date: values.release_date ? values.release_date : null,
        cover_image: (values.cover_image as any) ?? null,
      });
      await setAlbumStreamingLinks(album.id, values.streaming_links);
      return album;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["albums"] }),
        queryClient.invalidateQueries({ queryKey: ["album", data.id] }),
        queryClient.invalidateQueries({ queryKey: ["albumLinks", data.id] }),
      ]);
      navigate(`/admin/albums/${data.id}`, { replace: true });
    },
  });

  const isLoading = (!isNew && existing.isLoading) || artistsQuery.isLoading || platformsQuery.isLoading;

  return (
    <div>
      <AdminHeader title={isNew ? "New album" : "Edit album"} actionHref="/admin/albums" actionLabel="Back" />

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
                <Input {...form.register("title")} placeholder="Album title" />
              </div>
              <div className="space-y-1.5">
                <Label>Artist</Label>
                <select
                  className="focus-ring h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm"
                  {...form.register("artist_id")}
                >
                  <option value="" disabled>
                    Select artist…
                  </option>
                  {(artistsQuery.data ?? []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label hint="YYYY-MM-DD">Release date</Label>
                <Input {...form.register("release_date")} placeholder="2026-01-01" />
              </div>
              <div />
            </div>

            <ImageField control={form.control} name={"cover_image"} label="Cover image" folder="albums" />

            <StreamingLinksEditor
              control={form.control}
              name={"streaming_links"}
              platforms={platformsQuery.data ?? []}
              label="Album streaming links"
            />

            {save.error ? <div className="text-sm text-red-600">{toErrorMessage(save.error)}</div> : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
              <Link to="/admin/albums">
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

import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownToLine, Search } from "lucide-react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { ResolvedImage } from "@/components/ResolvedImage";
import { cn } from "@/utils/cn";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  searchDeezerAlbums,
  searchDeezerArtists,
  searchDeezerTracks,
  getDeezerAlbum,
  getDeezerArtist,
  getDeezerTrack,
} from "@/services/deezer/deezer";
import { toErrorMessage } from "@/services/db/errors";
import { getLocalIdByExternalId } from "@/services/import/externalLinks";
import { importDeezerAlbum, importDeezerArtist, importDeezerTrack } from "@/services/import/deezerImport";
import { queryClient } from "@/services/queryClient";

type Tab = "tracks" | "albums" | "artists";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "tracks", label: "Songs" },
  { id: "albums", label: "Albums" },
  { id: "artists", label: "Artists" },
];

function DeezerCard({
  title,
  subtitle,
  imageUrl,
  onPreview,
}: {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  onPreview: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square w-full">
        <ResolvedImage
          image={imageUrl ? { source: "url", url: imageUrl, file_path: null } : null}
          alt={title}
          className="h-full w-full"
          fallbackClassName="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      </div>
      <div className="p-3">
        <div className="line-clamp-1 text-sm font-semibold">{title}</div>
        {subtitle ? <div className="mt-1 line-clamp-1 text-xs text-[rgb(var(--muted))]">{subtitle}</div> : null}
        <div className="mt-3">
          <Button size="sm" onClick={onPreview}>
            Preview & import
          </Button>
        </div>
      </div>
    </Card>
  );
}

const trackSchema = z.object({
  songTitle: z.string().min(1),
  albumTitle: z.string().min(1),
  coverUrl: z.string().url().optional().or(z.literal("")),
  releaseDate: z.string().optional().or(z.literal("")),
});

const albumSchema = z.object({
  title: z.string().min(1),
  coverUrl: z.string().url().optional().or(z.literal("")),
  releaseDate: z.string().optional().or(z.literal("")),
  importTracks: z.boolean(),
});

const artistSchema = z.object({
  name: z.string().min(1),
  pictureUrl: z.string().url().optional().or(z.literal("")),
});

export default function DeezerImportPage() {
  const [tab, setTab] = React.useState<Tab>("tracks");
  const [q, setQ] = React.useState("");
  const dq = useDebouncedValue(q, 250);

  const searchQuery = useQuery({
    enabled: dq.trim().length >= 2,
    queryKey: ["deezerSearch", tab, dq],
    queryFn: async () => {
      if (tab === "tracks") return await searchDeezerTracks(dq);
      if (tab === "albums") return await searchDeezerAlbums(dq);
      return await searchDeezerArtists(dq);
    },
  });

  const [preview, setPreview] = React.useState<{ tab: Tab; id: number } | null>(null);

  const detailsQuery = useQuery({
    enabled: Boolean(preview),
    queryKey: ["deezerDetails", preview?.tab, preview?.id],
    queryFn: async () => {
      if (!preview) return null;
      if (preview.tab === "tracks") return await getDeezerTrack(preview.id);
      if (preview.tab === "albums") return await getDeezerAlbum(preview.id);
      return await getDeezerArtist(preview.id);
    },
  });

  const existingQuery = useQuery({
    enabled: Boolean(preview),
    queryKey: ["deezerExisting", preview?.tab, preview?.id],
    queryFn: async () => {
      if (!preview) return null;
      const entityType = preview.tab === "tracks" ? "songs" : preview.tab === "albums" ? "albums" : "artists";
      return await getLocalIdByExternalId({
        provider: "deezer",
        entityType: entityType as any,
        externalId: String(preview.id),
      });
    },
  });

  const trackForm = useForm<z.infer<typeof trackSchema>>({ resolver: zodResolver(trackSchema) });
  const albumForm = useForm<z.infer<typeof albumSchema>>({
    resolver: zodResolver(albumSchema),
    defaultValues: { importTracks: true },
  });
  const artistForm = useForm<z.infer<typeof artistSchema>>({ resolver: zodResolver(artistSchema) });

  React.useEffect(() => {
    const d: any = detailsQuery.data;
    if (!d || !preview) return;
    if (preview.tab === "tracks") {
      trackForm.reset({
        songTitle: d.title ?? "",
        albumTitle: d.album?.title ?? "",
        coverUrl: d.album?.cover_xl ?? d.album?.cover_medium ?? d.album?.cover ?? "",
        releaseDate: d.album?.release_date ?? "",
      });
    } else if (preview.tab === "albums") {
      albumForm.reset({
        title: d.title ?? "",
        coverUrl: d.cover_xl ?? d.cover_medium ?? d.cover ?? "",
        releaseDate: d.release_date ?? "",
        importTracks: true,
      });
    } else {
      artistForm.reset({
        name: d.name ?? "",
        pictureUrl: d.picture_xl ?? d.picture_medium ?? d.picture ?? "",
      });
    }
  }, [albumForm, artistForm, detailsQuery.data, preview, trackForm]);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!preview) throw new Error("No preview selected");
      if (preview.tab === "tracks") {
        const values = trackForm.getValues();
        return await importDeezerTrack({
          deezerTrack: detailsQuery.data,
          overrides: {
            songTitle: values.songTitle,
            albumTitle: values.albumTitle,
            coverUrl: values.coverUrl || undefined,
            releaseDate: values.releaseDate || undefined,
          },
        });
      }
      if (preview.tab === "albums") {
        const values = albumForm.getValues();
        return await importDeezerAlbum({
          deezerAlbum: detailsQuery.data,
          albumDetails: detailsQuery.data,
          overrides: {
            title: values.title,
            coverUrl: values.coverUrl || undefined,
            releaseDate: values.releaseDate || undefined,
          },
          importTracks: Boolean(values.importTracks),
        });
      }
      const values = artistForm.getValues();
      return await importDeezerArtist({
        deezerArtist: detailsQuery.data,
        overrides: { name: values.name, pictureUrl: values.pictureUrl || undefined },
      });
    },
    onSuccess: async () => {
      await Promise.all([searchQuery.refetch(), existingQuery.refetch()]);
    },
  });

  const results = (searchQuery.data ?? []) as any[];

  return (
    <div>
      <AdminHeader title="Deezer import" subtitle="Search Deezer and import into your Supabase catalog." />

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="w-full max-w-xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Deezer…"
              className="pl-9"
            />
          </div>
          <div className="mt-2 text-xs text-[rgb(var(--muted))]">
            Uses a built-in proxy at <span className="font-mono">/api/deezer</span> to avoid browser CORS issues.
          </div>
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

      {searchQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      ) : searchQuery.error ? (
        <Card className="p-6">
          <div className="text-sm text-red-600">{toErrorMessage(searchQuery.error)}</div>
        </Card>
      ) : dq.trim().length < 2 ? (
        <Card className="p-6">
          <div className="text-sm text-[rgb(var(--muted))]">Type at least 2 characters to search.</div>
        </Card>
      ) : results.length === 0 ? (
        <Card className="p-6">
          <div className="text-sm text-[rgb(var(--muted))]">No results.</div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((r) => {
            const id = r.id as number;
            const title =
              tab === "artists" ? r.name : tab === "albums" ? r.title : r.title;
            const subtitle =
              tab === "tracks"
                ? `${r.artist?.name ?? "—"} · ${r.album?.title ?? "—"}`
                : tab === "albums"
                  ? r.artist?.name ?? "Album"
                  : "Artist";
            const img =
              tab === "tracks"
                ? r.album?.cover_xl ?? r.album?.cover_medium ?? r.album?.cover ?? null
                : tab === "albums"
                  ? r.cover_xl ?? r.cover_medium ?? r.cover ?? null
                  : r.picture_xl ?? r.picture_medium ?? r.picture ?? null;
            return (
              <DeezerCard
                key={id}
                title={title}
                subtitle={subtitle}
                imageUrl={img}
                onPreview={() => setPreview({ tab, id })}
              />
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(preview)}
        onClose={() => {
          setPreview(null);
          importMutation.reset();
          queryClient.removeQueries({ queryKey: ["deezerDetails"] });
          queryClient.removeQueries({ queryKey: ["deezerExisting"] });
        }}
        title="Preview import"
      >
        {detailsQuery.isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : detailsQuery.error ? (
          <Card className="p-6">
            <div className="text-sm text-red-600">{toErrorMessage(detailsQuery.error)}</div>
          </Card>
        ) : (
          <div className="space-y-5">
            {existingQuery.data ? (
              <Card className="p-4">
                <div className="text-sm">
                  This item was already imported. Local id:{" "}
                  <span className="font-mono text-xs">{existingQuery.data}</span>
                </div>
              </Card>
            ) : null}

            {preview?.tab === "tracks" ? (
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-start">
                  <div className="aspect-square overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-black/5 dark:bg-white/5">
                    <ResolvedImage
                      image={
                        trackForm.watch("coverUrl")
                          ? { source: "url", url: trackForm.watch("coverUrl") as any, file_path: null }
                          : null
                      }
                      alt="Cover"
                      className="h-full w-full"
                      fallbackClassName="h-full w-full"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium">Song title</div>
                      <Input {...trackForm.register("songTitle")} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium">Album title</div>
                      <Input {...trackForm.register("albumTitle")} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <div className="text-sm font-medium">Cover URL</div>
                        <Input {...trackForm.register("coverUrl")} placeholder="https://…" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-sm font-medium">Release date</div>
                        <Input {...trackForm.register("releaseDate")} placeholder="YYYY-MM-DD" />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            ) : null}

            {preview?.tab === "albums" ? (
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-start">
                  <div className="aspect-square overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-black/5 dark:bg-white/5">
                    <ResolvedImage
                      image={
                        albumForm.watch("coverUrl")
                          ? { source: "url", url: albumForm.watch("coverUrl") as any, file_path: null }
                          : null
                      }
                      alt="Cover"
                      className="h-full w-full"
                      fallbackClassName="h-full w-full"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium">Album title</div>
                      <Input {...albumForm.register("title")} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <div className="text-sm font-medium">Cover URL</div>
                        <Input {...albumForm.register("coverUrl")} placeholder="https://…" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-sm font-medium">Release date</div>
                        <Input {...albumForm.register("releaseDate")} placeholder="YYYY-MM-DD" />
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" {...albumForm.register("importTracks")} />
                      Import tracks into Songs
                    </label>
                  </div>
                </div>
              </form>
            ) : null}

            {preview?.tab === "artists" ? (
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-start">
                  <div className="aspect-square overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-black/5 dark:bg-white/5">
                    <ResolvedImage
                      image={
                        artistForm.watch("pictureUrl")
                          ? { source: "url", url: artistForm.watch("pictureUrl") as any, file_path: null }
                          : null
                      }
                      alt="Artist"
                      className="h-full w-full"
                      fallbackClassName="h-full w-full"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium">Artist name</div>
                      <Input {...artistForm.register("name")} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium">Picture URL</div>
                      <Input {...artistForm.register("pictureUrl")} placeholder="https://…" />
                    </div>
                  </div>
                </div>
              </form>
            ) : null}

            {importMutation.error ? (
              <Card className="p-4">
                <div className="text-sm text-red-600">{toErrorMessage(importMutation.error)}</div>
              </Card>
            ) : null}

            {importMutation.data ? (
              <Card className="p-4">
                <div className="text-sm">
                  Imported successfully{" "}
                  {importMutation.data.wasExisting ? "(some entities already existed)" : ""}.
                </div>
              </Card>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-[rgb(var(--muted))]">
                Duplicates are prevented using <span className="font-mono">external_entity_links</span>.
              </div>
              <Button
                variant="primary"
                onClick={async () => {
                  if (!preview) return;
                  if (preview.tab === "tracks") await trackForm.handleSubmit(async () => importMutation.mutate())();
                  else if (preview.tab === "albums") await albumForm.handleSubmit(async () => importMutation.mutate())();
                  else await artistForm.handleSubmit(async () => importMutation.mutate())();
                }}
                disabled={importMutation.isPending || existingQuery.isLoading}
              >
                <ArrowDownToLine className="h-4 w-4" />
                {importMutation.isPending ? "Importing…" : "Import"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

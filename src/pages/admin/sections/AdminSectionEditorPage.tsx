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
import { Skeleton } from "@/components/ui/Skeleton";
import { SortableIdList, type SortableItem } from "@/components/admin/SortableIdList";

import {
  getHomeSection,
  listHomeSectionItems,
  setHomeSectionItems,
  upsertHomeSection,
} from "@/services/home/sections";
import { listSongs } from "@/services/music/songs";
import { listAlbums } from "@/services/music/albums";
import { listArtists } from "@/services/music/artists";
import { listPlaylists } from "@/services/music/playlists";
import { queryClient } from "@/services/queryClient";
import { toErrorMessage } from "@/services/db/errors";
import type { EntityType } from "@/types/media";

const schema = z.object({
  title: z.string().min(1),
  subtitle: z.string().nullable().or(z.literal("")),
  entity_type: z.enum(["songs", "albums", "artists", "playlists"]),
  sort_order: z.number().int().min(0),
  is_featured: z.boolean(),
  entity_ids: z.array(z.string().uuid()),
});

type FormValues = z.infer<typeof schema>;

async function listEntities(entityType: EntityType) {
  if (entityType === "songs") return listSongs({ limit: 500, offset: 0 });
  if (entityType === "albums") return listAlbums({ limit: 500, offset: 0 });
  if (entityType === "artists") return listArtists({ limit: 500, offset: 0 });
  return listPlaylists({ limit: 500, offset: 0 });
}

export default function AdminSectionEditorPage() {
  const { sectionId } = useParams();
  const isNew = !sectionId || sectionId === "new";
  const navigate = useNavigate();

  const existing = useQuery({
    enabled: !isNew,
    queryKey: ["homeSection", sectionId],
    queryFn: () => getHomeSection(sectionId!),
  });
  const existingItems = useQuery({
    enabled: !isNew,
    queryKey: ["homeSectionItems", sectionId],
    queryFn: () => listHomeSectionItems(sectionId!),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: existing.data
      ? {
          title: existing.data.title,
          subtitle: existing.data.subtitle ?? "",
          entity_type: existing.data.entity_type,
          sort_order: existing.data.sort_order,
          is_featured: existing.data.is_featured,
          entity_ids: (existingItems.data ?? []).map((i) => i.entity_id),
        }
      : { title: "", subtitle: "", entity_type: "albums", sort_order: 0, is_featured: false, entity_ids: [] },
  });

  const entityType = useWatch({ control: form.control, name: "entity_type" }) as EntityType;
  const entityIds = useWatch({ control: form.control, name: "entity_ids" }) ?? [];

  const catalogQuery = useQuery({
    queryKey: ["sectionCatalog", entityType],
    queryFn: () => listEntities(entityType),
  });

  const catalogMap = React.useMemo(() => {
    const m = new Map<string, any>();
    for (const e of catalogQuery.data ?? []) m.set(e.id, e);
    return m;
  }, [catalogQuery.data]);

  const items: SortableItem[] = React.useMemo(
    () =>
      entityIds.map((id) => {
        const e: any = catalogMap.get(id);
        const label = e?.title ?? e?.name ?? id;
        const subtitle =
          entityType === "songs" ? e?.album?.title ?? null : entityType === "albums" ? e?.artist?.name ?? null : null;
        return { id, label, subtitle };
      }),
    [catalogMap, entityIds, entityType],
  );

  const [pendingAddId, setPendingAddId] = React.useState("");

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      const section = await upsertHomeSection({
        id: isNew ? undefined : sectionId,
        title: values.title,
        subtitle: values.subtitle ? values.subtitle : null,
        entity_type: values.entity_type,
        sort_order: values.sort_order,
        is_featured: values.is_featured,
      });
      await setHomeSectionItems(section.id, values.entity_type, values.entity_ids);
      return section;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["homeSections"] }),
        queryClient.invalidateQueries({ queryKey: ["homeSection", data.id] }),
        queryClient.invalidateQueries({ queryKey: ["homeSectionItems", data.id] }),
        queryClient.invalidateQueries({ queryKey: ["homeResolved"] }),
      ]);
      navigate(`/admin/sections/${data.id}`, { replace: true });
    },
  });

  const isLoading = (!isNew && existing.isLoading) || catalogQuery.isLoading;

  return (
    <div>
      <AdminHeader title={isNew ? "New section" : "Edit section"} actionHref="/admin/sections" actionLabel="Back" />

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
                <Input {...form.register("title")} placeholder="Trending" />
              </div>
              <div className="space-y-1.5">
                <Label hint="Small hint text">Subtitle</Label>
                <Input {...form.register("subtitle")} placeholder="Fresh picks" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Entity type</Label>
                <select
                  className="focus-ring h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm"
                  value={entityType}
                  onChange={(e) => {
                    const next = e.target.value as EntityType;
                    form.setValue("entity_type", next, { shouldDirty: true });
                    form.setValue("entity_ids", [], { shouldDirty: true });
                    setPendingAddId("");
                  }}
                >
                  <option value="albums">Albums</option>
                  <option value="songs">Songs</option>
                  <option value="artists">Artists</option>
                  <option value="playlists">Playlists</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={form.watch("sort_order")}
                  onChange={(e) => form.setValue("sort_order", Number(e.target.value), { shouldDirty: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Featured</Label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(form.watch("is_featured"))}
                    onChange={(e) => form.setValue("is_featured", e.target.checked, { shouldDirty: true })}
                  />
                  Use as hero banner
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <Label hint="Drag to reorder">Items</Label>
                <div className="flex gap-2">
                  <select
                    className="focus-ring h-10 w-full min-w-[260px] rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm"
                    value={pendingAddId}
                    onChange={(e) => setPendingAddId(e.target.value)}
                  >
                    <option value="">Add item…</option>
                    {(catalogQuery.data ?? []).map((e: any) => (
                      <option key={e.id} value={e.id}>
                        {e.title ?? e.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!pendingAddId) return;
                      const curr = form.getValues("entity_ids") ?? [];
                      if (curr.includes(pendingAddId)) return;
                      form.setValue("entity_ids", [...curr, pendingAddId], { shouldDirty: true });
                      setPendingAddId("");
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {items.length ? (
                <SortableIdList
                  items={items}
                  onChange={(next) => form.setValue("entity_ids", next.map((i) => i.id), { shouldDirty: true })}
                  onRemove={(id) =>
                    form.setValue(
                      "entity_ids",
                      (form.getValues("entity_ids") ?? []).filter((x) => x !== id),
                      { shouldDirty: true },
                    )
                  }
                />
              ) : (
                <div className="text-sm text-[rgb(var(--muted))]">No items in this section yet.</div>
              )}
            </div>

            {save.error ? <div className="text-sm text-red-600">{toErrorMessage(save.error)}</div> : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
              <Link to="/admin/sections">
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


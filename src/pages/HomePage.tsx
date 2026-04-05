import { useQuery } from "@tanstack/react-query";

import { HeroBanner } from "@/components/HeroBanner";
import { MediaCard } from "@/components/MediaCard";
import { RowSection } from "@/components/RowSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { listHomeSectionItemsForSections, listHomeSections } from "@/services/home/sections";
import { resolveHomeSections } from "@/services/home/resolveSectionEntities";

export default function HomePage() {
  const sectionsQuery = useQuery({
    queryKey: ["homeSections"],
    queryFn: listHomeSections,
  });

  const itemsQuery = useQuery({
    enabled: (sectionsQuery.data?.length ?? 0) > 0,
    queryKey: ["homeSectionItems", sectionsQuery.data?.map((s) => s.id).join(",")],
    queryFn: () => listHomeSectionItemsForSections((sectionsQuery.data ?? []).map((s) => s.id)),
  });

  const resolvedQuery = useQuery({
    enabled: Boolean(sectionsQuery.data && itemsQuery.data),
    queryKey: ["homeResolved", sectionsQuery.data?.length ?? 0, itemsQuery.data?.length ?? 0],
    queryFn: () => resolveHomeSections(sectionsQuery.data ?? [], itemsQuery.data ?? []),
  });

  if (sectionsQuery.isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-40 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sectionsQuery.error) {
    return (
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
        <div className="text-sm text-[rgb(var(--muted))]">Failed to load home sections.</div>
      </div>
    );
  }

  const resolved = resolvedQuery.data ?? [];
  const featuredBlock = resolved.find((s) => s.section.is_featured && s.entities.length > 0) ?? null;
  const featured = featuredBlock?.entities?.[0] ?? null;
  const featuredKind =
    featuredBlock?.section.entity_type === "songs"
      ? "song"
      : featuredBlock?.section.entity_type === "albums"
        ? "album"
        : featuredBlock?.section.entity_type === "artists"
          ? "artist"
          : featuredBlock?.section.entity_type === "playlists"
            ? "playlist"
            : null;

  return (
    <div className="space-y-10">
      {featured && featuredKind ? (
        <HeroBanner
          kind={featuredKind as any}
          item={featured as any}
          description={"bio" in featured ? featured.bio : "description" in featured ? featured.description : null}
        />
      ) : (
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-10">
          <h1 className="text-2xl font-semibold">Discover music</h1>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Admin-curated rows appear here once sections are configured.
          </p>
        </div>
      )}

      {resolved.map(({ section, entities }) => {
        const kind =
          section.entity_type === "songs"
            ? "song"
            : section.entity_type === "albums"
              ? "album"
              : section.entity_type === "artists"
                ? "artist"
                : "playlist";

        if (!entities.length) return null;

        return (
          <RowSection key={section.id} title={section.title} subtitle={section.subtitle}>
            {entities.map((e: any) => (
                <MediaCard
                  key={e.id}
                  kind={kind as any}
                  item={e}
                  subtitle={
                    kind === "song"
                      ? e.album?.artist?.name ?? e.album?.title ?? "Song"
                    : kind === "album"
                      ? e.album_artists?.[0]?.artist?.name ??
                        e.artist?.name ??
                        (e.album_artists?.length ? "Various artists" : "Album")
                      : kind === "playlist"
                        ? "Playlist"
                        : "Artist"
                  }
                  className="w-40"
              />
            ))}
          </RowSection>
        );
      })}
    </div>
  );
}

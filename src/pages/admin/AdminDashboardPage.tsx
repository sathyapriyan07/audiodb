import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { supabase } from "@/services/supabase/client";

async function fetchCounts() {
  const tables = ["songs", "artists", "albums", "playlists", "platforms", "home_sections"] as const;
  const results = await Promise.all(
    tables.map(async (t) => {
      const { count, error } = await supabase.from(t).select("id", { count: "exact", head: true });
      if (error) throw error;
      return [t, count ?? 0] as const;
    }),
  );
  return Object.fromEntries(results) as Record<(typeof tables)[number], number>;
}

export default function AdminDashboardPage() {
  const q = useQuery({ queryKey: ["adminCounts"], queryFn: fetchCounts });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">Catalog health at a glance.</p>
      </div>

      {q.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : q.error ? (
        <Card className="p-6">
          <div className="text-sm text-[rgb(var(--muted))]">Failed to load stats.</div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["Songs", q.data!.songs],
              ["Artists", q.data!.artists],
              ["Albums", q.data!.albums],
              ["Playlists", q.data!.playlists],
              ["Platforms", q.data!.platforms],
              ["Home sections", q.data!.home_sections],
            ] as const
          ).map(([label, value]) => (
            <Card key={label} className="p-6">
              <div className="text-sm text-[rgb(var(--muted))]">{label}</div>
              <div className="mt-2 text-3xl font-semibold">{value}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

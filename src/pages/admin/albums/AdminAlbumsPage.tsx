import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { queryClient } from "@/services/queryClient";
import { deleteAlbum, listAlbums } from "@/services/music/albums";
import { toErrorMessage } from "@/services/db/errors";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export default function AdminAlbumsPage() {
  const [q, setQ] = React.useState("");
  const dq = useDebouncedValue(q, 200);

  const list = useQuery({
    queryKey: ["albums", dq],
    queryFn: () => listAlbums({ q: dq, limit: 50, offset: 0 }),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteAlbum(id),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["albums"] }),
  });

  return (
    <div>
      <AdminHeader title="Albums" actionHref="/admin/albums/new" actionLabel="New album" />

      <div className="mb-4 max-w-md">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search albums…" />
      </div>

      {list.isLoading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : list.error ? (
        <Card className="p-6">
          <div className="text-sm text-[rgb(var(--muted))]">{toErrorMessage(list.error)}</div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-[rgb(var(--border))]">
            {list.data!.length ? (
              list.data!.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-sm font-semibold">{a.title}</div>
                    <div className="mt-0.5 line-clamp-1 text-xs text-[rgb(var(--muted))]">
                      {a.artist?.name ?? "—"} {a.release_date ? `· ${a.release_date}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/admin/albums/${a.id}`}>
                      <Button size="sm">Edit</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (!confirm(`Delete album "${a.title}"? This may cascade.`)) return;
                        del.mutate(a.id);
                      }}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-sm text-[rgb(var(--muted))]">No albums yet.</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}


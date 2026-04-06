import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { BulkCreateModal } from "@/components/admin/BulkCreateModal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { queryClient } from "@/services/queryClient";
import { deletePlaylist, listPlaylists } from "@/services/music/playlists";
import { toErrorMessage } from "@/services/db/errors";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export default function AdminPlaylistsPage() {
  const [q, setQ] = React.useState("");
  const dq = useDebouncedValue(q, 200);
  const [bulkOpen, setBulkOpen] = React.useState(false);

  const list = useQuery({
    queryKey: ["playlists", dq],
    queryFn: () => listPlaylists({ q: dq, limit: 50, offset: 0 }),
  });

  const del = useMutation({
    mutationFn: (id: string) => deletePlaylist(id),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["playlists"] }),
  });

  return (
    <div>
      <AdminHeader
        title="Playlists"
        actionHref="/admin/playlists/new"
        actionLabel="New playlist"
        actions={
          <Button variant="secondary" onClick={() => setBulkOpen(true)}>
            Bulk create
          </Button>
        }
      />

      <div className="mb-4 max-w-md">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search playlists…" />
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
              list.data!.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-sm font-semibold">{p.title}</div>
                    <div className="mt-0.5 line-clamp-1 text-xs text-[rgb(var(--muted))]">
                      {p.description ?? "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/admin/playlists/${p.id}`}>
                      <Button size="sm">Edit</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (!confirm(`Delete playlist "${p.title}"?`)) return;
                        del.mutate(p.id);
                      }}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-sm text-[rgb(var(--muted))]">No playlists yet.</div>
            )}
          </div>
        </Card>
      )}

      <BulkCreateModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        entity="playlists"
        invalidateKeys={[["playlists"]]}
      />
    </div>
  );
}

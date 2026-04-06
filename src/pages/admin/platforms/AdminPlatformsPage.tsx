import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { BulkCreateModal } from "@/components/admin/BulkCreateModal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { queryClient } from "@/services/queryClient";
import { deletePlatform, listPlatforms } from "@/services/music/platforms";
import { toErrorMessage } from "@/services/db/errors";

export default function AdminPlatformsPage() {
  const q = useQuery({ queryKey: ["platforms"], queryFn: listPlatforms });
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const del = useMutation({
    mutationFn: (id: string) => deletePlatform(id),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["platforms"] }),
  });

  return (
    <div>
      <AdminHeader
        title="Platforms"
        subtitle="Used to render streaming buttons (no hardcoding)."
        actionHref="/admin/platforms/new"
        actionLabel="New platform"
        actions={
          <Button variant="secondary" onClick={() => setBulkOpen(true)}>
            Bulk create
          </Button>
        }
      />

      {q.isLoading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : q.error ? (
        <Card className="p-6">
          <div className="text-sm text-[rgb(var(--muted))]">{toErrorMessage(q.error)}</div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-[rgb(var(--border))]">
            {q.data!.length ? (
              q.data!.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-sm font-semibold">{p.name}</div>
                    <div className="mt-0.5 line-clamp-1 text-xs text-[rgb(var(--muted))]">
                      {p.logo ?? "No logo URL"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/admin/platforms/${p.id}`}>
                      <Button size="sm">Edit</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (!confirm(`Delete platform "${p.name}"?`)) return;
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
              <div className="p-6 text-sm text-[rgb(var(--muted))]">No platforms yet.</div>
            )}
          </div>
        </Card>
      )}

      <BulkCreateModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        entity="platforms"
        invalidateKeys={[["platforms"]]}
      />
    </div>
  );
}

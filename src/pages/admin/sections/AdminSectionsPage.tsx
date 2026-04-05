import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { queryClient } from "@/services/queryClient";
import { deleteHomeSection, listHomeSections } from "@/services/home/sections";
import { toErrorMessage } from "@/services/db/errors";

export default function AdminSectionsPage() {
  const q = useQuery({ queryKey: ["homeSections"], queryFn: listHomeSections });
  const del = useMutation({
    mutationFn: (id: string) => deleteHomeSection(id),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["homeSections"] }),
  });

  return (
    <div>
      <AdminHeader
        title="Home sections"
        subtitle="Curate the rows shown on the Home page."
        actionHref="/admin/sections/new"
        actionLabel="New section"
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
              q.data!.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-sm font-semibold">
                      {s.title} {s.is_featured ? <span className="text-xs text-[rgb(var(--muted))]">(featured)</span> : null}
                    </div>
                    <div className="mt-0.5 line-clamp-1 text-xs text-[rgb(var(--muted))]">
                      {s.entity_type} · sort {s.sort_order}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/admin/sections/${s.id}`}>
                      <Button size="sm">Edit</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (!confirm(`Delete section "${s.title}"?`)) return;
                        del.mutate(s.id);
                      }}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-sm text-[rgb(var(--muted))]">No sections yet.</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

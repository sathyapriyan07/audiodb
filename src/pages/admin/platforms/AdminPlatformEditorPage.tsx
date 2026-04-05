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
import { getPlatform, upsertPlatform } from "@/services/music/platforms";
import { toErrorMessage } from "@/services/db/errors";
import { queryClient } from "@/services/queryClient";

const schema = z.object({
  name: z.string().min(1),
  logo: z.string().url().nullable().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function AdminPlatformEditorPage() {
  const { platformId } = useParams();
  const isNew = !platformId || platformId === "new";
  const navigate = useNavigate();

  const existing = useQuery({
    enabled: !isNew,
    queryKey: ["platform", platformId],
    queryFn: () => getPlatform(platformId!),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: existing.data
      ? { name: existing.data.name, logo: existing.data.logo ?? "" }
      : { name: "", logo: "" },
  });

  const save = useMutation({
    mutationFn: async (values: FormValues) =>
      upsertPlatform({
        id: isNew ? undefined : platformId,
        name: values.name,
        logo: values.logo ? values.logo : null,
      }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["platforms"] });
      navigate(`/admin/platforms/${data.id}`, { replace: true });
    },
  });

  return (
    <div>
      <AdminHeader
        title={isNew ? "New platform" : "Edit platform"}
        actionHref="/admin/platforms"
        actionLabel="Back"
      />

      {!isNew && existing.isLoading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : existing.error ? (
        <Card className="p-6">
          <div className="text-sm text-[rgb(var(--muted))]">{toErrorMessage(existing.error)}</div>
        </Card>
      ) : (
        <Card className="p-6">
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => save.mutate(values))}
          >
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Spotify" />
            </div>
            <div className="space-y-1.5">
              <Label hint="Optional URL (SVG/PNG)">Logo URL</Label>
              <Input {...form.register("logo")} placeholder="https://…" />
            </div>

            {save.error ? <div className="text-sm text-red-600">{toErrorMessage(save.error)}</div> : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
              <Link to="/admin/platforms">
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

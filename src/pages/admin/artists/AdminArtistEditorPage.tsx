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
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageField } from "@/components/admin/ImageField";
import { getArtist, upsertArtist } from "@/services/music/artists";
import { toErrorMessage } from "@/services/db/errors";
import { queryClient } from "@/services/queryClient";
import type { ImageRef } from "@/types/media";

const schema = z.object({
  name: z.string().min(1),
  bio: z.string().nullable().or(z.literal("")),
  profile_image: z.custom<ImageRef | null>(),
});

type FormValues = z.infer<typeof schema>;

export default function AdminArtistEditorPage() {
  const { artistId } = useParams();
  const isNew = !artistId || artistId === "new";
  const navigate = useNavigate();

  const existing = useQuery({
    enabled: !isNew,
    queryKey: ["artist", artistId],
    queryFn: () => getArtist(artistId!),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: existing.data
      ? {
          name: existing.data.name,
          bio: existing.data.bio ?? "",
          profile_image: existing.data.profile_image ?? null,
        }
      : { name: "", bio: "", profile_image: null },
  });

  const save = useMutation({
    mutationFn: async (values: FormValues) =>
      upsertArtist({
        id: isNew ? undefined : artistId,
        name: values.name,
        bio: values.bio ? values.bio : null,
        profile_image: (values.profile_image as any) ?? null,
      }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["artists"] });
      navigate(`/admin/artists/${data.id}`, { replace: true });
    },
  });

  return (
    <div>
      <AdminHeader title={isNew ? "New artist" : "Edit artist"} actionHref="/admin/artists" actionLabel="Back" />

      {!isNew && existing.isLoading ? (
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
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Artist name" />
              </div>
              <div />
            </div>

            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea {...form.register("bio")} placeholder="Short bio…" />
            </div>

            <ImageField control={form.control} name={"profile_image"} label="Profile image" folder="artists" />

            {save.error ? <div className="text-sm text-red-600">{toErrorMessage(save.error)}</div> : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
              <Link to="/admin/artists">
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

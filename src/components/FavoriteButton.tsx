import { useMutation, useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

import type { EntityType } from "@/types/media";
import { useAuth } from "@/services/auth/AuthProvider";
import { isFavorite, setFavorite } from "@/services/user/favorites";
import { queryClient } from "@/services/queryClient";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

export function FavoriteButton({
  entityType,
  entityId,
  className,
}: {
  entityType: EntityType;
  entityId: string;
  className?: string;
}) {
  const { user } = useAuth();

  const favQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ["favorite", entityType, entityId],
    queryFn: () => isFavorite(entityType, entityId),
  });

  const mutate = useMutation({
    mutationFn: async () => setFavorite(entityType, entityId, !favQuery.data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["favorite", entityType, entityId] }),
        queryClient.invalidateQueries({ queryKey: ["favorites", entityType] }),
      ]);
    },
  });

  if (!user) {
    return (
      <Link to="/login" state={{ from: window.location.pathname }}>
        <Button variant="secondary" size="sm" className={className}>
          <Heart className="h-4 w-4" />
          Save
        </Button>
      </Link>
    );
  }

  const active = Boolean(favQuery.data);

  return (
    <Button
      variant={active ? "primary" : "secondary"}
      size="sm"
      className={cn(className)}
      onClick={() => mutate.mutate()}
      disabled={mutate.isPending || favQuery.isLoading}
      aria-label={active ? "Remove favorite" : "Add favorite"}
    >
      <Heart className={cn("h-4 w-4", active ? "" : "text-[rgb(var(--muted))]")} />
      {active ? "Saved" : "Save"}
    </Button>
  );
}

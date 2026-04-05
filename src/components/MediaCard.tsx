import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";

import { cn } from "@/utils/cn";
import { Card } from "@/components/ui/Card";
import { ResolvedImage } from "@/components/ResolvedImage";
import type { Album, Artist, Playlist, Song } from "@/types/media";

type MediaKind = "song" | "album" | "artist" | "playlist";

function getHref(kind: MediaKind, id: string) {
  if (kind === "song") return `/songs/${id}`;
  if (kind === "album") return `/albums/${id}`;
  if (kind === "artist") return `/artists/${id}`;
  return `/playlists/${id}`;
}

export function MediaCard({
  kind,
  item,
  subtitle,
  className,
}: {
  kind: MediaKind;
  item: Song | Album | Artist | Playlist;
  subtitle?: string | null;
  className?: string;
}) {
  const title = "title" in item ? item.title : item.name;
  const image =
    kind === "artist"
      ? (item as Artist).profile_image
      : "cover_image" in item
        ? (item as any).cover_image
        : null;

  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
      <Link to={getHref(kind, item.id)} className="block">
        <Card
          className={cn(
            "group overflow-hidden border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm transition hover:shadow-lg",
            className,
          )}
        >
          <div
            className={cn(
              "relative aspect-square w-full",
              kind === "artist" && "overflow-hidden rounded-b-3xl bg-black/5 dark:bg-white/5",
            )}
          >
            <ResolvedImage
              image={image}
              alt={title}
              className={cn("h-full w-full", kind === "artist" && "rounded-b-3xl")}
              fallbackClassName={cn("h-full w-full", kind === "artist" && "rounded-b-3xl")}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-80" />
            <div className="pointer-events-none absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-2xl bg-white/15 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
              <Play className="h-5 w-5" />
            </div>
          </div>
          <div className="p-3">
            <div className="line-clamp-1 text-sm font-semibold">{title}</div>
            <div className="mt-1 line-clamp-1 text-xs text-[rgb(var(--muted))]">
              {subtitle ?? (kind.charAt(0).toUpperCase() + kind.slice(1))}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

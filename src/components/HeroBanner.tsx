import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { ResolvedImage } from "@/components/ResolvedImage";
import type { Album, Artist, Playlist, Song } from "@/types/media";

type HeroKind = "song" | "album" | "artist" | "playlist";

export function HeroBanner({
  kind,
  item,
  description,
}: {
  kind: HeroKind;
  item: Song | Album | Artist | Playlist;
  description?: string | null;
}) {
  const title = "title" in item ? item.title : item.name;
  const image =
    kind === "artist"
      ? (item as Artist).profile_image
      : "cover_image" in item
        ? (item as any).cover_image
        : null;

  const href =
    kind === "song"
      ? `/songs/${item.id}`
      : kind === "album"
        ? `/albums/${item.id}`
        : kind === "artist"
          ? `/artists/${item.id}`
          : `/playlists/${item.id}`;

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
      <div className="absolute inset-0 opacity-70">
        <ResolvedImage image={image} alt={title} className="h-full w-full blur-[3px] scale-110" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/55 to-black/80" />
      <div className="relative grid gap-6 p-6 md:grid-cols-[220px_1fr] md:items-end md:p-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="aspect-square overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
            <ResolvedImage
              image={image}
              alt={title}
              className="h-full w-full"
              fallbackClassName="h-full w-full"
            />
          </div>
        </motion.div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Listen now · Featured {kind}
          </div>
          <h1 className="mt-2 line-clamp-2 text-2xl font-semibold leading-tight text-white md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl line-clamp-3 text-sm text-white/70">{description}</p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to={href}>
              <Button variant="primary" size="lg">
                <Play className="h-4 w-4" />
                Open
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

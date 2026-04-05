import type { ImageRef } from "@/types/media";
import { cn } from "@/utils/cn";
import { resolveImageUrl } from "@/services/images/resolveImage";

export function ResolvedImage({
  image,
  alt,
  className,
  fallbackClassName,
}: {
  image: ImageRef | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const src = resolveImageUrl(image);
  if (!src) {
    return (
      <div
        aria-label={alt}
        className={cn(
          "bg-[radial-gradient(600px_circle_at_20%_20%,rgba(99,102,241,0.35),transparent_60%),radial-gradient(600px_circle_at_70%_10%,rgba(236,72,153,0.22),transparent_55%)]",
          fallbackClassName,
          className,
        )}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("object-cover", className)}
    />
  );
}

import { Pause, Play, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { ResolvedImage } from "@/components/ResolvedImage";
import { usePlayer } from "@/store/player/PlayerProvider";
import { cn } from "@/utils/cn";

function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MiniPlayer({ className }: { className?: string }) {
  const { track, isPlaying, progress, duration, toggle, seek, stop } = usePlayer();
  if (!track) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 lg:left-[280px] lg:inset-x-auto lg:bottom-0",
        className,
      )}
    >
      <div className="mx-auto max-w-[1400px] px-3 pb-3 lg:px-6 lg:pb-6">
        <div className="rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--bg))]/75 p-3 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-black/5 dark:bg-white/5">
              <ResolvedImage image={track.cover_image} alt={track.title} className="h-full w-full" fallbackClassName="h-full w-full" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-1 text-sm font-semibold">{track.title}</div>
              <div className="mt-0.5 line-clamp-1 text-xs text-[rgb(var(--muted))]">
                {track.preview_url ? `${track.artistsText} · Deezer preview` : `${track.artistsText} · No preview`}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="text-[10px] text-[rgb(var(--muted))] w-10 text-right">
                  {formatTime(progress)}
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, duration)}
                  value={Math.min(progress, duration || progress)}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="w-full accent-[rgb(var(--accent))]"
                  disabled={!track.preview_url}
                />
                <div className="text-[10px] text-[rgb(var(--muted))] w-10">
                  {formatTime(duration)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={toggle}
                disabled={!track.preview_url}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={stop} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

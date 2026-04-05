import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { Platform } from "@/types/media";

export function StreamingButtons({ links }: { links: Array<{ url: string; platform: Platform }> }) {
  if (!links.length) {
    return <div className="text-sm text-[rgb(var(--muted))]">No streaming links provided.</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <a key={`${l.platform.id}:${l.url}`} href={l.url} target="_blank" rel="noreferrer">
          <Button variant="secondary" size="sm">
            {l.platform.logo ? (
              <img src={l.platform.logo} alt={l.platform.name} className="h-4 w-4 rounded-sm" />
            ) : (
              <span className="h-4 w-4 rounded-sm bg-black/10 dark:bg-white/10" />
            )}
            {l.platform.name}
            <ExternalLink className="h-4 w-4 text-[rgb(var(--muted))]" />
          </Button>
        </a>
      ))}
    </div>
  );
}

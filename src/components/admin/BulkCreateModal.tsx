import React from "react";
import { useMutation } from "@tanstack/react-query";
import { FileText, UploadCloud } from "lucide-react";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/utils/cn";
import { toErrorMessage } from "@/services/db/errors";
import { bulkCreate, parseBulkInput, type BulkEntity } from "@/services/admin/bulkCreate";
import { queryClient } from "@/services/queryClient";

const templates: Record<BulkEntity, string> = {
  artists: "name\tbio\timage_url\nEd Sheeran\tPop singer\thttps://...\nA R Rahman\tComposer\thttps://...",
  platforms: "name\tlogo\nSpotify\thttps://...\nDeezer\thttps://...",
  albums: "title\tartists\trelease_date\tcover_url\nDivide\tEd Sheeran|Benny Blanco\t2017-03-03\thttps://...",
  playlists: "title\tdescription\tcover_url\nRoadtrip\tUpbeat driving tracks\thttps://...\nChill\tLate night vibes\thttps://...",
  sections:
    "title\tsubtitle\tentity_type\tsort_order\tis_featured\nTrending Artists\tMost played this week\tartists\t0\ttrue\nTop Tracks\tYour picks\tsongs\t1\tfalse",
  songs:
    "title\talbum_title\tartists\tduration\trelease_date\tpreview_url\tcover_url\tdeezer_url\nShape of You\tDivide\tEd Sheeran\t233\t2017-01-06\thttps://...mp3\thttps://...\thttps://www.deezer.com/track/...",
};

export function BulkCreateModal({
  open,
  onClose,
  entity,
  invalidateKeys,
}: {
  open: boolean;
  onClose: () => void;
  entity: BulkEntity;
  invalidateKeys: Array<unknown[]>;
}) {
  const [raw, setRaw] = React.useState("");
  const [parsed, setParsed] = React.useState(() => parseBulkInput(entity, ""));

  React.useEffect(() => {
    if (!open) return;
    setRaw("");
    setParsed(parseBulkInput(entity, ""));
  }, [entity, open]);

  React.useEffect(() => {
    const t = window.setTimeout(() => setParsed(parseBulkInput(entity, raw)), 200);
    return () => window.clearTimeout(t);
  }, [entity, raw]);

  const mutation = useMutation({
    mutationFn: async () => {
      const p = parseBulkInput(entity, raw);
      if (p.errors.length) throw new Error(p.errors[0]);
      return await bulkCreate(entity, p.items);
    },
    onSuccess: async () => {
      for (const k of invalidateKeys) {
        await queryClient.invalidateQueries({ queryKey: k as any });
      }
    },
  });

  const canCreate = parsed.items.length > 0 && parsed.errors.length === 0 && !mutation.isPending;

  return (
    <Modal
      open={open}
      onClose={() => {
        mutation.reset();
        onClose();
      }}
      title="Bulk create"
      className="max-w-4xl"
    >
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">Paste TSV or JSONL</div>
              <div className="mt-1 text-xs text-[rgb(var(--muted))]">
                TSV: first row is header. For multi-artists, use <span className="font-mono">Artist1|Artist2</span>.
              </div>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={() => setRaw(templates[entity])}>
              <FileText className="h-4 w-4" />
              Insert template
            </Button>
          </div>

          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={templates[entity]}
            className="min-h-[320px] font-mono text-xs leading-relaxed"
          />

          {parsed.errors.length ? (
            <Card className="border-red-500/30 bg-red-500/5 p-4">
              <div className="text-sm font-semibold text-red-600">Parse errors</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-red-600">
                {parsed.errors.slice(0, 6).map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          {mutation.error ? (
            <Card className="border-red-500/30 bg-red-500/5 p-4">
              <div className="text-sm text-red-600">{toErrorMessage(mutation.error)}</div>
            </Card>
          ) : null}

          {mutation.data ? (
            <Card className="border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="text-sm">
                Created <span className="font-semibold">{mutation.data.createdIds.length}</span>, skipped{" "}
                <span className="font-semibold">{mutation.data.skipped.duplicates}</span> duplicates.
              </div>
            </Card>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-[rgb(var(--muted))]">
              Parsed: <span className="font-semibold text-[rgb(var(--fg))]">{parsed.items.length}</span>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => mutation.mutate()}
              disabled={!canCreate}
            >
              <UploadCloud className="h-4 w-4" />
              {mutation.isPending ? "Creating…" : `Create ${parsed.items.length}`}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <Card className="p-4">
            <div className="text-sm font-semibold">Preview</div>
            <div className="mt-2 text-xs text-[rgb(var(--muted))]">
              Showing first 6 rows. Duplicates are skipped when possible.
            </div>
          </Card>

          <div className="space-y-2">
            {parsed.items.slice(0, 6).map((it: any, idx: number) => (
              <Card key={idx} className={cn("p-4")}>
                <div className="text-sm font-semibold line-clamp-1">
                  {it.title ?? it.name}
                </div>
                {"artists" in it && Array.isArray(it.artists) ? (
                  <div className="mt-1 text-xs text-[rgb(var(--muted))] line-clamp-1">
                    {it.artists.join(", ")}
                  </div>
                ) : null}
                {"album_title" in it && it.album_title ? (
                  <div className="mt-1 text-xs text-[rgb(var(--muted))] line-clamp-1">
                    Album: {it.album_title}
                  </div>
                ) : null}
                {"preview_url" in it && it.preview_url ? (
                  <div className="mt-1 text-[10px] text-[rgb(var(--muted))] line-clamp-1">Preview URL set</div>
                ) : null}
              </Card>
            ))}

            {!parsed.items.length ? (
              <Card className="p-6">
                <div className="text-sm text-[rgb(var(--muted))]">Nothing to preview yet.</div>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}

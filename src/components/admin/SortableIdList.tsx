import React from "react";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";

function SortableRow({
  id,
  label,
  subtitle,
  onRemove,
}: {
  id: string;
  label: string;
  subtitle?: string | null;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3",
        isDragging && "opacity-70",
      )}
    >
      <button
        type="button"
        className="focus-ring grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--muted))]"
        {...attributes}
        {...listeners}
        aria-label="Drag"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-sm font-semibold">{label}</div>
        {subtitle ? <div className="mt-0.5 line-clamp-1 text-xs text-[rgb(var(--muted))]">{subtitle}</div> : null}
      </div>
      {onRemove ? (
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label="Remove">
          <Trash2 className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}

export type SortableItem = { id: string; label: string; subtitle?: string | null };

export function SortableIdList({
  items,
  onChange,
  onRemove,
}: {
  items: SortableItem[];
  onChange: (next: SortableItem[]) => void;
  onRemove?: (id: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((it) => (
            <SortableRow
              key={it.id}
              id={it.id}
              label={it.label}
              subtitle={it.subtitle}
              onRemove={onRemove ? () => onRemove(it.id) : undefined}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}


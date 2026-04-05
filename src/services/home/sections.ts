import { supabase } from "@/services/supabase/client";
import type { EntityType, HomeSection, HomeSectionItem } from "@/types/media";

export async function listHomeSections() {
  const { data, error } = await supabase
    .from("home_sections")
    .select("id,title,subtitle,entity_type,sort_order,is_featured")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as HomeSection[];
}

export async function getHomeSection(sectionId: string) {
  const { data, error } = await supabase
    .from("home_sections")
    .select("id,title,subtitle,entity_type,sort_order,is_featured")
    .eq("id", sectionId)
    .single();
  if (error) throw error;
  return data as HomeSection;
}

export async function upsertHomeSection(values: {
  id?: string;
  title: string;
  subtitle: string | null;
  entity_type: EntityType;
  sort_order: number;
  is_featured: boolean;
}) {
  const { data, error } = await supabase
    .from("home_sections")
    .upsert(values, { onConflict: "id" })
    .select("id,title,subtitle,entity_type,sort_order,is_featured")
    .single();
  if (error) throw error;
  return data as HomeSection;
}

export async function deleteHomeSection(sectionId: string) {
  const { error } = await supabase.from("home_sections").delete().eq("id", sectionId);
  if (error) throw error;
}

export async function listHomeSectionItems(sectionId: string) {
  const { data, error } = await supabase
    .from("home_section_items")
    .select("id,section_id,entity_type,entity_id,sort_order")
    .eq("section_id", sectionId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as HomeSectionItem[];
}

export async function listHomeSectionItemsForSections(sectionIds: string[]) {
  if (!sectionIds.length) return [] as HomeSectionItem[];
  const { data, error } = await supabase
    .from("home_section_items")
    .select("id,section_id,entity_type,entity_id,sort_order")
    .in("section_id", sectionIds)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as HomeSectionItem[];
}

export async function setHomeSectionItems(
  sectionId: string,
  entityType: EntityType,
  entityIdsInOrder: string[],
) {
  const { error: delErr } = await supabase
    .from("home_section_items")
    .delete()
    .eq("section_id", sectionId);
  if (delErr) throw delErr;
  if (!entityIdsInOrder.length) return;
  const { error } = await supabase.from("home_section_items").insert(
    entityIdsInOrder.map((id, idx) => ({
      section_id: sectionId,
      entity_type: entityType,
      entity_id: id,
      sort_order: idx,
    })),
  );
  if (error) throw error;
}

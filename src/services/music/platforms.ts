import { supabase } from "@/services/supabase/client";

export type PlatformRow = {
  id: string;
  name: string;
  logo: string | null;
};

export async function listPlatforms() {
  const { data, error } = await supabase
    .from("platforms")
    .select("id,name,logo")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PlatformRow[];
}

export async function getPlatform(platformId: string) {
  const { data, error } = await supabase
    .from("platforms")
    .select("id,name,logo")
    .eq("id", platformId)
    .single();
  if (error) throw error;
  return data as PlatformRow;
}

export async function upsertPlatform(values: { id?: string; name: string; logo: string | null }) {
  const { data, error } = await supabase
    .from("platforms")
    .upsert(values, { onConflict: "id" })
    .select("id,name,logo")
    .single();
  if (error) throw error;
  return data as PlatformRow;
}

export async function deletePlatform(platformId: string) {
  const { error } = await supabase.from("platforms").delete().eq("id", platformId);
  if (error) throw error;
}


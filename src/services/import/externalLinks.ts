import { supabase } from "@/services/supabase/client";
import type { EntityType } from "@/types/media";

export type Provider = "deezer";

export async function getLocalIdByExternalId(params: {
  provider: Provider;
  entityType: EntityType;
  externalId: string;
}) {
  const { data, error } = await supabase
    .from("external_entity_links")
    .select("local_id")
    .eq("provider", params.provider)
    .eq("entity_type", params.entityType)
    .eq("external_id", params.externalId)
    .maybeSingle();
  if (error) throw error;
  return (data?.local_id as string | undefined) ?? null;
}

export async function linkExternalId(params: {
  provider: Provider;
  entityType: EntityType;
  externalId: string;
  localId: string;
}) {
  const { error } = await supabase.from("external_entity_links").upsert(
    {
      provider: params.provider,
      entity_type: params.entityType,
      external_id: params.externalId,
      local_id: params.localId,
    },
    { onConflict: "provider,entity_type,external_id" },
  );
  if (error) throw error;
}


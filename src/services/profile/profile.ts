import { supabase } from "@/services/supabase/client";
import type { Profile } from "@/services/auth/AuthProvider";

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,is_admin,created_at,updated_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

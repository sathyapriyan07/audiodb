import type { Session, User } from "@supabase/supabase-js";
import React from "react";

import { supabase } from "@/services/supabase/client";
import { getProfile } from "@/services/profile/profile";

export type Profile = {
  id: string;
  email: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const refreshProfile = React.useCallback(async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id ?? null;
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      const next = await getProfile(userId);
      setProfile(next);
    } catch {
      setProfile(null);
    }
  }, []);

  React.useEffect(() => {
    let isActive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!isActive) return;
      setSession(data.session ?? null);
      setIsLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isActive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    refreshProfile().catch(() => {});
  }, [session?.user?.id, refreshProfile]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAdmin: Boolean(profile?.is_admin),
      isLoading,
      refreshProfile,
    }),
    [isLoading, profile, refreshProfile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

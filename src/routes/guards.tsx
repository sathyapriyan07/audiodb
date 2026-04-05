import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/services/auth/AuthProvider";
import { FullScreenSpinner } from "@/components/ui/Spinner";

export function RequireAdmin() {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullScreenSpinner label="Loading session" />;

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <div className="container-app py-12">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Your account is not marked as admin.
        </p>
      </div>
    );
  }

  return <Outlet />;
}

export function RedirectIfAuthed({ to }: { to: string }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullScreenSpinner label="Loading session" />;
  if (user) return <Navigate to={to} replace />;
  return <Outlet />;
}

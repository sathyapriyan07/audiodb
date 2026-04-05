import { Link, NavLink, Outlet } from "react-router-dom";
import { Album, Compass, Home, LayoutGrid, ListMusic, LogOut, Mic2, Radio, Settings2 } from "lucide-react";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/services/auth/auth";

const nav = [
  { to: "/admin", label: "Dashboard", icon: Home, end: true },
  { to: "/admin/songs", label: "Songs", icon: Radio },
  { to: "/admin/artists", label: "Artists", icon: Mic2 },
  { to: "/admin/albums", label: "Albums", icon: Album },
  { to: "/admin/playlists", label: "Playlists", icon: ListMusic },
  { to: "/admin/sections", label: "Sections", icon: LayoutGrid },
  { to: "/admin/platforms", label: "Platforms", icon: Settings2 },
];

export function AdminLayout() {
  return (
    <div className="min-h-[70vh]">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-medium">
            <Compass className="h-4 w-4" />
            Back to app
          </Link>
          <span className="text-sm text-[rgb(var(--muted))]">/</span>
          <span className="text-sm font-semibold">Admin</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-2">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
            Manage
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "focus-ring inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[rgb(var(--muted))] hover:bg-black/5 hover:text-[rgb(var(--fg))] dark:hover:bg-white/5",
                    isActive && "bg-black/5 text-[rgb(var(--fg))] dark:bg-white/5",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </div>
  );
}

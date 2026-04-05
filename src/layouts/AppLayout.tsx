import { Link, NavLink, Outlet } from "react-router-dom";
import { Home, Music2, Search, Shield, SunMoon } from "lucide-react";

import { cn } from "@/utils/cn";
import { useTheme } from "@/services/theme/ThemeProvider";
import { useAuth } from "@/services/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/services/auth/auth";

function Logo() {
  return (
    <Link to="/" className="focus-ring inline-flex items-center gap-2 rounded-lg">
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[rgb(var(--fg))] text-[rgb(var(--bg))] dark:bg-white dark:text-slate-900">
        <Music2 className="h-5 w-5" />
      </span>
      <span className="hidden text-sm font-semibold tracking-wide sm:inline">Musics</span>
    </Link>
  );
}

function SidebarNav() {
  const { mode, setMode } = useTheme();
  const { isAdmin, user } = useAuth();

  const toggleTheme = () => setMode(mode === "dark" ? "light" : "dark");

  return (
    <aside className="hidden w-[280px] shrink-0 lg:block">
      <div className="sticky top-0 h-screen border-r border-[rgb(var(--border))] bg-[rgb(var(--bg))]/70 backdrop-blur">
        <div className="p-5">
          <Logo />
        </div>

        <nav className="px-3">
          <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
            Library
          </div>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                "focus-ring mb-1 inline-flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium",
                isActive
                  ? "bg-black/5 text-[rgb(var(--fg))] dark:bg-white/5"
                  : "text-[rgb(var(--muted))] hover:bg-black/5 hover:text-[rgb(var(--fg))] dark:hover:bg-white/5",
              )
            }
          >
            <Home className="h-4 w-4" />
            Home
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              cn(
                "focus-ring mb-1 inline-flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium",
                isActive
                  ? "bg-black/5 text-[rgb(var(--fg))] dark:bg-white/5"
                  : "text-[rgb(var(--muted))] hover:bg-black/5 hover:text-[rgb(var(--fg))] dark:hover:bg-white/5",
              )
            }
          >
            <Search className="h-4 w-4" />
            Search
          </NavLink>
          {isAdmin ? (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "focus-ring mb-1 inline-flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-black/5 text-[rgb(var(--fg))] dark:bg-white/5"
                    : "text-[rgb(var(--muted))] hover:bg-black/5 hover:text-[rgb(var(--fg))] dark:hover:bg-white/5",
                )
              }
            >
              <Shield className="h-4 w-4" />
              Admin
            </NavLink>
          ) : null}
        </nav>

        <div className="mt-auto px-3 pb-5 pt-6">
          <div className="flex items-center gap-2 px-3">
            <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
              <SunMoon className="h-4 w-4" />
              Theme
            </Button>
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => signOut()} aria-label="Sign out">
                Sign out
              </Button>
            ) : null}
          </div>
          <div className="mt-3 px-3 text-xs text-[rgb(var(--muted))]">Apple Music–style browsing layout.</div>
        </div>
      </div>
    </aside>
  );
}

function MobileTopBar() {
  const { mode, setMode } = useTheme();
  const { isAdmin } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]/70 backdrop-blur lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Link
              to="/admin"
              className="focus-ring inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode(mode === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <SunMoon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function MobileTabBar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 lg:hidden">
      <div className="pointer-events-auto mx-auto max-w-2xl px-3 pb-3">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))]/70 p-2 shadow-xl backdrop-blur">
          <nav className="grid grid-cols-2 gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  "focus-ring inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-black/5 text-[rgb(var(--fg))] dark:bg-white/5"
                    : "text-[rgb(var(--muted))] hover:bg-black/5 hover:text-[rgb(var(--fg))] dark:hover:bg-white/5",
                )
              }
            >
              <Home className="h-4 w-4" />
              Home
            </NavLink>
            <NavLink
              to="/search"
              className={({ isActive }) =>
                cn(
                  "focus-ring inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-black/5 text-[rgb(var(--fg))] dark:bg-white/5"
                    : "text-[rgb(var(--muted))] hover:bg-black/5 hover:text-[rgb(var(--fg))] dark:hover:bg-white/5",
                )
              }
            >
              <Search className="h-4 w-4" />
              Search
            </NavLink>
          </nav>
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-full">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1000px_circle_at_15%_0%,rgba(236,72,153,0.22),transparent_55%),radial-gradient(900px_circle_at_70%_10%,rgba(99,102,241,0.22),transparent_60%)]" />
      <div className="flex min-h-full">
        <SidebarNav />
        <div className="min-w-0 flex-1">
          <MobileTopBar />
          <main className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-6 md:px-6 lg:px-10 lg:pb-10 lg:pt-10">
            <Outlet />
          </main>
        </div>
      </div>
      <MobileTabBar />
    </div>
  );
}

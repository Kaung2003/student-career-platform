import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import type { StudentProfile } from "../lib/types";
import { Logo } from "./Logo";
import { Avatar } from "./ui/Avatar";
import { ChatWidget } from "./ChatWidget";
import {
  AwardIcon,
  DashboardIcon,
  ExternalLinkIcon,
  FolderIcon,
  LogOutIcon,
  MenuIcon,
  MessageSquareIcon,
  MicIcon,
  MoonIcon,
  SearchIcon,
  SparklesIcon,
  SunIcon,
  UserIcon,
  XIcon,
  type IconComponent,
} from "./icons";

export const PROFILE_UPDATED_EVENT = "scp:profile-updated";

interface NavItem {
  to: string;
  label: string;
  icon: IconComponent;
  badge?: string;
}

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
      { to: "/assistant", label: "AI Assistant", icon: SparklesIcon, badge: "AI" },
    ],
  },
  {
    title: "Portfolio",
    items: [
      { to: "/profile", label: "Profile", icon: UserIcon },
      { to: "/projects", label: "Projects", icon: FolderIcon },
      { to: "/certifications", label: "Certifications", icon: AwardIcon },
    ],
  },
  {
    title: "Career",
    items: [
      { to: "/interview", label: "Interview Prep", icon: MicIcon },
      { to: "/directory", label: "Discover", icon: SearchIcon },
    ],
  },
  {
    title: "Support",
    items: [{ to: "/feedback", label: "Feedback", icon: MessageSquareIcon }],
  },
];

function SidebarContent({ slug, onNavigate }: { slug: string | null; onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    onNavigate?.();
    logout();
    navigate("/");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Logo to="/dashboard" onClick={onNavigate} />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
                    }`
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="rounded-md bg-gradient-to-r from-violet-500 to-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {slug && (
        <div className="mx-3 mb-3 rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-slate-800 dark:from-blue-500/10 dark:to-indigo-500/5">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your public portfolio</p>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">/p/{slug}</p>
          <a
            href={`/p/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            View live page <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={user?.name ?? "?"} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user?.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-1">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <LogOutIcon className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const fullBleed = location.pathname === "/assistant";

  useEffect(() => {
    function load() {
      api
        .get<{ profile: StudentProfile | null }>("/profile/me")
        .then((res) => setSlug(res.profile?.slug ?? null))
        .catch(() => {});
    }
    load();
    window.addEventListener(PROFILE_UPDATED_EVENT, load);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, load);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
        <SidebarContent slug={slug} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="animate-pop-in absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl dark:bg-slate-900">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <XIcon className="h-5 w-5" />
            </button>
            <SidebarContent slug={slug} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/90">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <Logo to="/dashboard" />
          <Link to="/assistant" aria-label="AI Assistant" className="rounded-lg p-2 text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-500/10">
            <SparklesIcon className="h-5 w-5" />
          </Link>
        </header>

        {fullBleed ? (
          children
        ) : (
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
        )}
      </div>

      {!fullBleed && <ChatWidget />}
    </div>
  );
}

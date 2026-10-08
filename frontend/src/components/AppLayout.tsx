import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import type { StudentProfile } from "../lib/types";
import { Logo } from "./Logo";
import { Avatar } from "./ui/Avatar";
import { ChatWidget } from "./ChatWidget";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "../i18n/I18nContext";
import type { MessageKey } from "../i18n/locales/en";
import {
  ArrowLeftIcon,
  AwardIcon,
  HelpCircleIcon,
  InboxIcon,
  ShieldIcon,
  UsersIcon,
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
  label: MessageKey;
  icon: IconComponent;
  badge?: string;
}

type Section = { title: MessageKey; items: NavItem[] };

const sections: Section[] = [
  {
    title: "nav.overview",
    items: [
      { to: "/dashboard", label: "common.dashboard", icon: DashboardIcon },
      { to: "/assistant", label: "nav.assistant", icon: SparklesIcon, badge: "AI" },
    ],
  },
  {
    title: "nav.portfolio",
    items: [
      { to: "/profile", label: "nav.profile", icon: UserIcon },
      { to: "/projects", label: "nav.projects", icon: FolderIcon },
      { to: "/certifications", label: "nav.certifications", icon: AwardIcon },
    ],
  },
  {
    title: "nav.career",
    items: [
      { to: "/interview", label: "nav.interview", icon: MicIcon },
      { to: "/directory", label: "common.discover", icon: SearchIcon },
    ],
  },
  {
    title: "nav.support",
    items: [{ to: "/feedback", label: "nav.feedback", icon: MessageSquareIcon }],
  },
];

const adminSections: Section[] = [
  {
    title: "nav.admin",
    items: [
      { to: "/admin", label: "nav.overview", icon: DashboardIcon },
      { to: "/admin/users", label: "nav.users", icon: UsersIcon },
      { to: "/admin/feedback", label: "nav.feedbackInbox", icon: InboxIcon },
      { to: "/admin/questions", label: "nav.questions", icon: HelpCircleIcon },
      { to: "/admin/comments", label: "nav.comments", icon: MessageSquareIcon },
    ],
  },
];

export type LayoutVariant = "app" | "admin";

function SidebarContent({
  slug,
  variant,
  onNavigate,
}: {
  slug: string | null;
  variant: LayoutVariant;
  onNavigate?: () => void;
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const navigate = useNavigate();

  const navSections: Section[] =
    variant === "admin"
      ? adminSections
      : user?.role === "ADMIN"
        ? [...sections, { title: "nav.administration", items: [{ to: "/admin", label: "nav.adminPanel", icon: ShieldIcon }] }]
        : sections;

  function handleLogout() {
    onNavigate?.();
    logout();
    navigate("/");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2 px-5">
        <Logo to={variant === "admin" ? "/admin" : "/dashboard"} onClick={onNavigate} />
        {variant === "admin" && (
          <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-white dark:text-slate-900">
            Admin
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t(section.title)}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/admin"}
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
                  <span className="flex-1">{t(label)}</span>
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

      {variant === "admin" && (
        <div className="mx-3 mb-3">
          <Link
            to="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeftIcon className="h-4 w-4" /> {t("nav.backToApp")}
          </Link>
        </div>
      )}

      {variant === "app" && slug && (
        <div className="mx-3 mb-3 rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-slate-800 dark:from-blue-500/10 dark:to-indigo-500/5">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t("nav.yourPortfolio")}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">/p/{slug}</p>
          <a
            href={`/p/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            {t("nav.viewLive")} <ExternalLinkIcon className="h-3.5 w-3.5" />
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
        <LanguageSwitcher className="mt-1 w-full [&>select]:w-full" />
        <div className="mt-1 grid grid-cols-2 gap-1">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            {theme === "dark" ? t("common.light") : t("common.dark")}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <LogOutIcon className="h-4 w-4" />
            {t("common.logOut")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppLayout({ children, variant = "app" }: { children: ReactNode; variant?: LayoutVariant }) {
  const location = useLocation();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const fullBleed = location.pathname === "/assistant";

  useEffect(() => {
    if (variant === "admin") return;
    function load() {
      api
        .get<{ profile: StudentProfile | null }>("/profile/me")
        .then((res) => setSlug(res.profile?.slug ?? null))
        .catch(() => {});
    }
    load();
    window.addEventListener(PROFILE_UPDATED_EVENT, load);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, load);
  }, [variant]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
        <SidebarContent slug={slug} variant={variant} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="animate-pop-in absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl dark:bg-slate-900">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label={t("nav.closeMenu")}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <XIcon className="h-5 w-5" />
            </button>
            <SidebarContent slug={slug} variant={variant} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/90">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label={t("nav.openMenu")}
            className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <Logo to={variant === "admin" ? "/admin" : "/dashboard"} />
          {variant === "admin" ? (
            <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white dark:bg-white dark:text-slate-900">
              Admin
            </span>
          ) : (
          <Link to="/assistant" aria-label={t("nav.assistant")} className="rounded-lg p-2 text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-500/10">
            <SparklesIcon className="h-5 w-5" />
          </Link>
          )}
        </header>

        {fullBleed ? (
          children
        ) : (
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
        )}
      </div>

      {variant === "app" && !fullBleed && <ChatWidget />}
    </div>
  );
}

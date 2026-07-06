import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/profile", label: "Profile" },
  { to: "/projects", label: "Projects" },
  { to: "/certifications", label: "Certifications" },
  { to: "/interview", label: "Interview Prep" },
  { to: "/feedback", label: "Feedback" },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
          <circle cx="12" cy="12" r="4" />
          <path
            strokeLinecap="round"
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login");
  }

  function linkClass(to: string) {
    const active = location.pathname === to;
    return active
      ? "text-blue-600 dark:text-blue-400"
      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100";
  }

  return (
    <nav className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          to="/dashboard"
          className="font-mono text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100"
          onClick={() => setMenuOpen(false)}
        >
          career.platform
        </Link>

        {user && (
          <>
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <button
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Toggle menu"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            <div className="hidden items-center gap-6 text-sm md:flex">
              {links.map((link) => (
                <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                  {link.label}
                </Link>
              ))}
              <span className="text-slate-400 dark:text-slate-500">{user.name}</span>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
              >
                Log out
              </button>
            </div>
          </>
        )}
      </div>

      {user && menuOpen && (
        <div className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 text-sm md:hidden dark:border-slate-800">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 ${linkClass(link.to)}`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 px-2 pt-3 dark:border-slate-800">
            <span className="text-slate-400 dark:text-slate-500">{user.name}</span>
            <button onClick={handleLogout} className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

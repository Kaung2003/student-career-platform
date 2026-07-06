import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login");
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/dashboard" className="text-lg font-semibold text-gray-900" onClick={() => setMenuOpen(false)}>
          Career Platform
        </Link>

        {user && (
          <>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle menu"
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <div className="hidden items-center gap-6 text-sm md:flex">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link to="/profile" className="text-gray-600 hover:text-gray-900">
                Profile
              </Link>
              <Link to="/projects" className="text-gray-600 hover:text-gray-900">
                Projects
              </Link>
              <span className="text-gray-400">{user.name}</span>
              <button
                onClick={handleLogout}
                className="rounded-md bg-gray-900 px-3 py-1.5 text-white hover:bg-gray-700"
              >
                Log out
              </button>
            </div>
          </>
        )}
      </div>

      {user && menuOpen && (
        <div className="flex flex-col gap-1 border-t border-gray-200 px-4 py-3 text-sm md:hidden">
          <Link
            to="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="rounded-md px-2 py-2 text-gray-600 hover:bg-gray-50"
          >
            Dashboard
          </Link>
          <Link
            to="/profile"
            onClick={() => setMenuOpen(false)}
            className="rounded-md px-2 py-2 text-gray-600 hover:bg-gray-50"
          >
            Profile
          </Link>
          <Link
            to="/projects"
            onClick={() => setMenuOpen(false)}
            className="rounded-md px-2 py-2 text-gray-600 hover:bg-gray-50"
          >
            Projects
          </Link>
          <div className="mt-2 flex items-center justify-between border-t border-gray-100 px-2 pt-3">
            <span className="text-gray-400">{user.name}</span>
            <button
              onClick={handleLogout}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-white hover:bg-gray-700"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

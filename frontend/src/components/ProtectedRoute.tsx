import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "./AppLayout";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

function FullPageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
    </div>
  );
}

/** Layout route for pages that require a signed-in user. */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role === "EMPLOYER") return <Navigate to="/company" replace />;

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

/** Layout route for the company panel: company accounts only. */
export function CompanyRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== "EMPLOYER") return <Navigate to="/dashboard" replace />;

  return (
    <AppLayout variant="company">
      <Outlet />
    </AppLayout>
  );
}

/** Signed-in only, without the app shell (e.g. the printable resume). */
export function BareProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role === "EMPLOYER") return <Navigate to="/company" replace />;
  return <Outlet />;
}

/** Layout route for the admin panel: signed-in users with the ADMIN role only. */
export function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppLayout variant="admin">
      <Outlet />
    </AppLayout>
  );
}

/** Layout route for pages anyone can see: the app shell when signed in, the public header otherwise. */
export function OptionalAuthRoute() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageSpinner />;

  if (user) {
    return (
      <AppLayout>
        <Outlet />
      </AppLayout>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { StudentProfile } from "../lib/types";

export function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ profile: StudentProfile | null }>("/profile/me")
      .then((res) => setProfile(res.profile))
      .finally(() => setLoading(false));
  }, []);

  const projectCount = profile?.projects?.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user?.name}</h1>
        <p className="mt-1 text-gray-500">Here's an overview of your portfolio.</p>

        {!loading && !profile && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-6">
            <h2 className="font-medium text-amber-900">Set up your profile</h2>
            <p className="mt-1 text-sm text-amber-800">
              You haven't created your student profile yet. Add a headline, bio, and skills to get your public
              portfolio page live.
            </p>
            <Link
              to="/profile"
              className="mt-3 inline-block rounded-md bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
            >
              Create profile
            </Link>
          </div>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <Link
            to="/profile"
            className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="font-medium text-gray-900">Profile</h2>
            <p className="mt-1 text-sm text-gray-500">
              {profile ? "Edit your headline, bio, and links" : "Not set up yet"}
            </p>
          </Link>

          <Link
            to="/projects"
            className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="font-medium text-gray-900">Projects</h2>
            <p className="mt-1 text-sm text-gray-500">
              {projectCount} project{projectCount === 1 ? "" : "s"}
            </p>
          </Link>

          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="font-medium text-gray-900">Public portfolio</h2>
            {profile ? (
              <a
                href={`/p/${profile.slug}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm text-gray-900 underline"
              >
                /p/{profile.slug}
              </a>
            ) : (
              <p className="mt-1 text-sm text-gray-500">Available after you create a profile</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

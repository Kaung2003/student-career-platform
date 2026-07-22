import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { api } from "../lib/api";
import type { DirectoryEntry } from "../lib/types";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { inputClass } from "../components/ui/Field";

export function Directory() {
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const search = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      api
        .get<{ profiles: DirectoryEntry[] }>(`/public${search}`)
        .then((res) => setProfiles(res.profiles))
        .catch(() => setProfiles([]))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Discover students</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Search by name, school, headline, or skill to find and visit other student portfolios.
        </p>

        <input
          type="text"
          placeholder="Search students..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputClass} mt-6`}
        />

        <div className="mt-6 space-y-4">
          {loading && <p className="text-slate-500 dark:text-slate-400">Loading...</p>}

          {!loading && profiles.length === 0 && (
            <EmptyState
              title="No students found"
              description={query ? "Try a different search term." : "No public profiles yet."}
            />
          )}

          {profiles.map((profile) => (
            <Link key={profile.slug} to={`/p/${profile.slug}`}>
              <Card className="transition hover:border-blue-400 dark:hover:border-blue-600">
                <h3 className="font-medium text-slate-900 dark:text-slate-100">{profile.name}</h3>
                {profile.headline && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{profile.headline}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                  {profile.school && <span>{profile.school}</span>}
                  {profile.gradYear && <span>Class of {profile.gradYear}</span>}
                </div>
                {profile.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

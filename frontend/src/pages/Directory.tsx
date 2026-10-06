import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { DirectoryEntry } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { inputClass } from "../components/ui/Field";
import { ArrowRightIcon, MapPinIcon, SearchIcon } from "../components/icons";

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
    <div>
      <PageHeader
        title="Discover students"
        description="Explore portfolios from students across schools. Search by name, school, headline, or skill."
      />

      <div className="relative mb-8 max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search students, schools, or skills..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputClass} py-3 pl-11 text-base shadow-sm`}
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="h-6 w-6" />}
          title="No students found"
          description={query ? "Try a different name, school, or skill." : "No public profiles yet — be the first!"}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Link key={profile.slug} to={`/p/${profile.slug}`} className="group">
              <Card className="flex h-full flex-col transition group-hover:-translate-y-0.5 group-hover:border-blue-300 group-hover:shadow-md dark:group-hover:border-blue-500/50">
                <div className="flex items-center gap-3">
                  <Avatar name={profile.name} size="lg" />
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900 dark:text-white">{profile.name}</h3>
                    {(profile.school || profile.gradYear) && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                        <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                        {[profile.school, profile.gradYear && `'${String(profile.gradYear).slice(-2)}`].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                  {profile.headline ?? "Student building their portfolio"}
                </p>
                {profile.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {profile.skills.slice(0, 4).map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                    {profile.skills.length > 4 && <Badge>+{profile.skills.length - 4}</Badge>}
                  </div>
                )}
                <p className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                  View portfolio <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

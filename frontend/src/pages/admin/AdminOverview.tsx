import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import type { AdminStats } from "../../lib/types";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Skeleton } from "../../components/ui/Skeleton";
import { FEEDBACK_STATUS, FEEDBACK_TYPE } from "./adminLabels";

function SignupChart({ data }: { data: AdminStats["signups"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const label = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">New sign-ups</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Last 14 days · {total} total</p>
        </div>
        <button
          onClick={() => setShowTable((s) => !s)}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          {showTable ? "Show chart" : "Show table"}
        </button>
      </div>

      {showTable ? (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
              <th className="py-1.5 font-medium">Date</th>
              <th className="py-1.5 text-right font-medium">Sign-ups</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((d) => (
              <tr key={d.date}>
                <td className="py-1.5 text-slate-700 dark:text-slate-300">{label(d.date)}</td>
                <td className="py-1.5 text-right tabular-nums text-slate-900 dark:text-white">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="mt-6">
          <div className="relative flex h-44 items-end gap-[2px] pl-7" onMouseLeave={() => setHover(null)}>
            {[0.5, 1].map((f) => (
              <div
                key={f}
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate-200 dark:border-slate-800"
                style={{ bottom: `${f * 100}%` }}
              >
                <span className="absolute -top-2 left-0 text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                  {Math.round(max * f)}
                </span>
              </div>
            ))}
            {data.map((d, i) => (
              <div
                key={d.date}
                className="group relative flex h-full flex-1 cursor-default items-end justify-center"
                onMouseEnter={() => setHover(i)}
                aria-label={`${label(d.date)}: ${d.count} sign-ups`}
              >
                <div
                  className={`w-full max-w-7 rounded-t-[4px] transition-colors ${
                    hover === i ? "bg-blue-700 dark:bg-blue-300" : "bg-blue-600 dark:bg-blue-400"
                  }`}
                  style={{ height: d.count ? `${(d.count / max) * 100}%` : "2px", opacity: d.count ? 1 : 0.25 }}
                />
                {hover === i && (
                  <div className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-white dark:text-slate-900">
                    <span className="font-semibold tabular-nums">{d.count}</span> on {label(d.date)}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="ml-7 mt-2 flex justify-between border-t border-slate-200 pt-2 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
            <span>{data[0] && label(data[0].date)}</span>
            <span>{data[Math.floor(data.length / 2)] && label(data[Math.floor(data.length / 2)]!.date)}</span>
            <span>Today</span>
          </div>
        </div>
      )}
    </Card>
  );
}

export function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get<AdminStats>("/admin/stats").then(setStats).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const t = stats.totals;
  const tiles = [
    { label: "Total users", value: t.users, sub: `+${t.newUsers} this week`, to: "/admin/users" },
    { label: "Open feedback", value: t.openFeedback, sub: "New or in progress", to: "/admin/feedback" },
    { label: "Practice answers", value: t.attempts, sub: `${t.questions} questions in bank`, to: "/admin/questions" },
    { label: "Projects", value: t.projects, sub: `${t.certifications} certifications tracked`, to: "/admin/users" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Admin overview" description="Platform health, growth, and items that need your attention." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.label} to={tile.to} className="group">
            <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:shadow-md">
              <p className="text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">{tile.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                {tile.value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tile.sub}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SignupChart data={stats.signups} />
        </div>
        <Card>
          <h2 className="font-semibold text-slate-900 dark:text-white">Accounts</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ["Admins", t.admins],
              ["Suspended", t.suspended],
              ["Portfolio comments", t.comments],
              ["Interview questions", t.questions],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Newest members</h2>
            <Link to="/admin/users" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
              All users
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {stats.latestUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <Avatar name={u.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{u.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                </div>
                {u.role === "ADMIN" && <Badge tone="violet">Admin</Badge>}
                <span className="text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Needs attention</h2>
            <Link to="/admin/feedback" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
              Open inbox
            </Link>
          </div>
          {stats.latestFeedback.length === 0 ? (
            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">Inbox zero — no open feedback. 🎉</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.latestFeedback.map((f) => (
                <li key={f.id} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Badge tone={FEEDBACK_TYPE[f.type].tone}>{FEEDBACK_TYPE[f.type].label}</Badge>
                    <Badge tone={FEEDBACK_STATUS[f.status].tone}>{FEEDBACK_STATUS[f.status].label}</Badge>
                    <span className="ml-auto text-xs text-slate-400">{f.userName}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-700 dark:text-slate-300">{f.message}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

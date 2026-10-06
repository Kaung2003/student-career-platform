import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useUi } from "../../context/UiContext";
import { api, ApiError } from "../../lib/api";
import type { AdminUser, Role } from "../../lib/types";
import { PageHeader } from "../../components/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { inputClass } from "../../components/ui/Field";
import { BanIcon, CheckIcon, ExternalLinkIcon, SearchIcon, TrashIcon, UsersIcon } from "../../components/icons";
import { ROLE_LABEL } from "./adminLabels";

const ROLES = Object.keys(ROLE_LABEL) as Role[];

export function AdminUsers() {
  const { user: me } = useAuth();
  const { toast, confirm } = useUi();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [status, setStatus] = useState<"" | "active" | "suspended">("");

  function load() {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    return api
      .get<{ users: AdminUser[] }>(`/admin/users?${params.toString()}`)
      .then((res) => setUsers(res.users))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const id = setTimeout(() => void load(), 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, role, status]);

  async function update(target: AdminUser, data: { role?: Role; suspended?: boolean }, message: string) {
    try {
      await api.patch(`/admin/users/${target.id}`, data);
      setUsers((list) => list.map((u) => (u.id === target.id ? { ...u, ...data } : u)));
      toast(message);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Update failed", "error");
    }
  }

  async function changeRole(target: AdminUser, newRole: Role) {
    if (newRole === "ADMIN") {
      const ok = await confirm({
        title: `Make ${target.name} an admin?`,
        message: "Admins can manage every user, read all feedback, and moderate content.",
        confirmLabel: "Make admin",
      });
      if (!ok) return;
    }
    await update(target, { role: newRole }, `${target.name} is now ${ROLE_LABEL[newRole].toLowerCase()}`);
  }

  async function toggleSuspend(target: AdminUser) {
    if (!target.suspended) {
      const ok = await confirm({
        title: `Suspend ${target.name}?`,
        message: "They'll be signed out and won't be able to log in until you reactivate the account. Their data is kept.",
        confirmLabel: "Suspend",
        danger: true,
      });
      if (!ok) return;
    }
    await update(target, { suspended: !target.suspended }, target.suspended ? `${target.name} reactivated` : `${target.name} suspended`);
  }

  async function remove(target: AdminUser) {
    const ok = await confirm({
      title: `Delete ${target.name}?`,
      message: "This permanently deletes the account with its profile, projects, certifications, practice history, and comments.",
      confirmLabel: "Delete permanently",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/users/${target.id}`);
      setUsers((list) => list.filter((u) => u.id !== target.id));
      toast("User deleted");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Delete failed", "error");
    }
  }

  const selectClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return (
    <div>
      <PageHeader title="Users" description="Search members, change roles, and suspend or remove accounts." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value as Role | "")} className={selectClass} aria-label="Filter by role">
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className={selectClass}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : users.length === 0 ? (
        <EmptyState icon={<UsersIcon className="h-6 w-6" />} title="No users found" description="Try a different search or filter." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Projects</th>
                  <th className="px-3 py-3 text-right">Practice</th>
                  <th className="px-3 py-3">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const isMe = u.id === me?.id;
                  return (
                    <tr key={u.id} className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 dark:text-white">
                              {u.name} {isMe && <span className="text-xs font-normal text-slate-400">(you)</span>}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={u.role}
                          disabled={isMe}
                          onChange={(e) => void changeRole(u, e.target.value as Role)}
                          aria-label={`Role for ${u.name}`}
                          className="rounded-md border border-slate-200 bg-white py-1 pl-2 pr-7 text-xs font-medium text-slate-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        {u.suspended ? <Badge tone="red">Suspended</Badge> : <Badge tone="green">Active</Badge>}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{u.projects}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{u.attempts}</td>
                      <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          {u.slug && (
                            <a
                              href={`/p/${u.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              title="View portfolio"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                              <ExternalLinkIcon className="h-4 w-4" />
                            </a>
                          )}
                          {!isMe && (
                            <>
                              <button
                                onClick={() => void toggleSuspend(u)}
                                title={u.suspended ? "Reactivate" : "Suspend"}
                                className={`rounded-lg p-1.5 ${
                                  u.suspended
                                    ? "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                                    : "text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
                                }`}
                              >
                                {u.suspended ? <CheckIcon className="h-4 w-4" /> : <BanIcon className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => void remove(u)}
                                title="Delete user"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Showing {users.length} user{users.length === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}

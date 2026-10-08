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
import { ROLES } from "./adminLabels";
import { useI18n } from "../../i18n/I18nContext";

export function AdminUsers() {
  const { user: me } = useAuth();
  const { toast, confirm } = useUi();
  const { t, formatDate } = useI18n();
  const roleLabel = (r: Role) => t(`admin.role.${r}`);
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
      toast(err instanceof ApiError ? err.message : t("admin.users.updateFailed"), "error");
    }
  }

  async function changeRole(target: AdminUser, newRole: Role) {
    if (newRole === "ADMIN") {
      const ok = await confirm({
        title: t("admin.users.makeAdminTitle", { name: target.name }),
        message: t("admin.users.makeAdminMessage"),
        confirmLabel: t("admin.users.makeAdmin"),
      });
      if (!ok) return;
    }
    await update(target, { role: newRole }, t("admin.users.roleChanged", { name: target.name, role: roleLabel(newRole) }));
  }

  async function toggleSuspend(target: AdminUser) {
    if (!target.suspended) {
      const ok = await confirm({
        title: t("admin.users.suspendTitle", { name: target.name }),
        message: t("admin.users.suspendMessage"),
        confirmLabel: t("admin.users.suspend"),
        danger: true,
      });
      if (!ok) return;
    }
    await update(target, { suspended: !target.suspended }, target.suspended ? t("admin.users.reactivated", { name: target.name }) : t("admin.users.suspendedToast", { name: target.name }));
  }

  async function remove(target: AdminUser) {
    const ok = await confirm({
      title: t("admin.users.deleteTitle", { name: target.name }),
      message: t("admin.users.deleteMessage"),
      confirmLabel: t("admin.users.deletePermanently"),
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/users/${target.id}`);
      setUsers((list) => list.filter((u) => u.id !== target.id));
      toast(t("admin.users.deleted"));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("admin.users.deleteFailed"), "error");
    }
  }

  const selectClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return (
    <div>
      <PageHeader title={t("admin.users.title")} description={t("admin.users.description")} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder={t("admin.users.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value as Role | "")} className={selectClass} aria-label={t("admin.users.filterRole")}>
          <option value="">{t("admin.users.allRoles")}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className={selectClass}
          aria-label={t("admin.users.filterStatus")}
        >
          <option value="">{t("admin.users.allStatuses")}</option>
          <option value="active">{t("admin.users.active")}</option>
          <option value="suspended">{t("admin.users.suspended")}</option>
        </select>
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : users.length === 0 ? (
        <EmptyState icon={<UsersIcon className="h-6 w-6" />} title={t("admin.users.emptyTitle")} description={t("admin.users.emptyDescription")} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">{t("admin.users.colUser")}</th>
                  <th className="px-3 py-3">{t("admin.users.colRole")}</th>
                  <th className="px-3 py-3">{t("admin.users.colStatus")}</th>
                  <th className="px-3 py-3 text-right">{t("admin.users.colProjects")}</th>
                  <th className="px-3 py-3 text-right">{t("admin.users.colPractice")}</th>
                  <th className="px-3 py-3">{t("admin.users.colJoined")}</th>
                  <th className="px-5 py-3 text-right">{t("admin.users.colActions")}</th>
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
                              {u.name} {isMe && <span className="text-xs font-normal text-slate-400">{t("admin.users.you")}</span>}
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
                          aria-label={t("admin.users.roleFor", { name: u.name })}
                          className="rounded-md border border-slate-200 bg-white py-1 pl-2 pr-7 text-xs font-medium text-slate-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {roleLabel(r)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        {u.suspended ? <Badge tone="red">{t("admin.users.suspended")}</Badge> : <Badge tone="green">{t("admin.users.active")}</Badge>}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{u.projects}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{u.attempts}</td>
                      <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          {u.slug && (
                            <a
                              href={`/p/${u.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              title={t("admin.users.viewPortfolio")}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                              <ExternalLinkIcon className="h-4 w-4" />
                            </a>
                          )}
                          {!isMe && (
                            <>
                              <button
                                onClick={() => void toggleSuspend(u)}
                                title={u.suspended ? t("admin.users.reactivate") : t("admin.users.suspend")}
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
                                title={t("admin.users.deleteUser")}
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
            {t("admin.users.showing", { count: users.length })}
          </p>
        </div>
      )}
    </div>
  );
}

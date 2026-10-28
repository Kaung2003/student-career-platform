import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useI18n } from "../../i18n/I18nContext";
import type { MessageKey } from "../../i18n/locales/en";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ShieldIcon } from "../../components/icons";

interface AuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
}

function summarize(details: Record<string, unknown> | null) {
  if (!details) return "";
  if (typeof details["from"] === "string" && typeof details["to"] === "string") {
    return `${details["email"] ?? ""} · ${details["from"]} → ${details["to"]}`;
  }
  const text = details["email"] ?? details["prompt"] ?? details["body"] ?? details["name"];
  return typeof text === "string" ? text : "";
}

export function AdminAudit() {
  const { t, locale } = useI18n();
  const [logs, setLogs] = useState<AuditEntry[] | null>(null);

  useEffect(() => {
    api
      .get<{ logs: AuditEntry[] }>("/admin/audit-logs")
      .then((res) => setLogs(res.logs))
      .catch(() => setLogs([]));
  }, []);

  const actionLabel = (action: string) => {
    const key = `admin.audit.action.${action}` as MessageKey;
    const label = t(key);
    return label === key ? action : label;
  };

  return (
    <div>
      <PageHeader title={t("admin.audit.title")} description={t("admin.audit.description")} />
      {logs === null ? (
        <Skeleton className="h-80" />
      ) : logs.length === 0 ? (
        <EmptyState icon={<ShieldIcon className="h-6 w-6" />} title={t("admin.audit.empty")} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">{t("admin.audit.colWhen")}</th>
                  <th className="px-3 py-3">{t("admin.audit.colWho")}</th>
                  <th className="px-3 py-3">{t("admin.audit.colAction")}</th>
                  <th className="px-5 py-3">{t("admin.audit.colDetails")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(log.createdAt).toLocaleString(locale)}
                    </td>
                    <td className="px-3 py-3 text-slate-900 dark:text-slate-100">{log.actorName ?? t("admin.audit.removedAdmin")}</td>
                    <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-100">{actionLabel(log.action)}</td>
                    <td className="max-w-md truncate px-5 py-3 text-slate-600 dark:text-slate-400">{summarize(log.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

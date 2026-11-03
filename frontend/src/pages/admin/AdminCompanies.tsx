import { useEffect, useState } from "react";
import { useUi } from "../../context/UiContext";
import { useI18n } from "../../i18n/I18nContext";
import { api, ApiError } from "../../lib/api";
import { COMPANY_STATUS_TONE } from "../../lib/company";
import type { AdminCompany, CompanyStatus } from "../../lib/types";
import { PageHeader } from "../../components/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field, inputClass } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import { BuildingIcon, ExternalLinkIcon } from "../../components/icons";

const FILTERS: CompanyStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export function AdminCompanies() {
  const { toast } = useUi();
  const { t, locale } = useI18n();
  const [status, setStatus] = useState<CompanyStatus>("PENDING");
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<AdminCompany | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get<{ companies: AdminCompany[] }>(`/admin/companies?status=${status}`)
      .then((res) => setCompanies(res.companies))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, [status]);

  async function review(company: AdminCompany, next: "APPROVED" | "REJECTED", reason?: string) {
    setBusyId(company.id);
    try {
      await api.post(`/admin/companies/${company.id}/review`, { status: next, ...(reason ? { note: reason } : {}) });
      setCompanies((list) => list.filter((c) => c.id !== company.id));
      toast(t(next === "APPROVED" ? "admin.companies.approved" : "admin.companies.rejected", { name: company.name }));
      setRejecting(null);
      setNote("");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("common.somethingWrong"), "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader title={t("admin.companies.title")} description={t("admin.companies.description")} />

      <div className="scroll-row mb-5 flex gap-2">
        {FILTERS.map((f) => (
          <Button key={f} size="sm" variant={f === status ? "primary" : "secondary"} onClick={() => setStatus(f)}>
            {t(`company.status.${f}`)}
          </Button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : companies.length === 0 ? (
        <EmptyState icon={<BuildingIcon className="h-5 w-5" />} title={t("admin.companies.empty")} />
      ) : (
        <div className="space-y-4">
          {companies.map((company) => (
            <Card key={company.id}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-slate-900 dark:text-white">{company.name}</h2>
                <Badge tone={COMPANY_STATUS_TONE[company.status]}>{t(`company.status.${company.status}`)}</Badge>
                {!company.emailConfirmed && <Badge tone="amber">{t("admin.users.unverified")}</Badge>}
                <Badge tone={company.emailMatchesWebsite ? "green" : "red"}>
                  {t(company.emailMatchesWebsite ? "admin.companies.domainMatch" : "admin.companies.domainMismatch")}
                </Badge>
              </div>
              <a href={company.website} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-1.5 text-sm text-blue-600 hover:underline dark:text-blue-400">
                <span className="truncate">{company.website}</span> <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" />
              </a>
              <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-400">
                {company.contactName} · {company.contactEmail}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{new Date(company.createdAt).toLocaleDateString(locale)}</p>
              {company.description && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">{company.description}</p>}
              {company.reviewNote && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{t("company.reason", { reason: company.reviewNote })}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {company.status !== "APPROVED" && (
                  <Button size="sm" disabled={busyId === company.id || !company.emailConfirmed} onClick={() => void review(company, "APPROVED")}>
                    {t("admin.companies.approve")}
                  </Button>
                )}
                {company.status !== "REJECTED" && (
                  <Button size="sm" variant="secondary" disabled={busyId === company.id} onClick={() => setRejecting(company)}>
                    {t("admin.companies.reject")}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title={t("admin.companies.rejectTitle", { name: rejecting?.name ?? "" })}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" disabled={busyId !== null} onClick={() => rejecting && void review(rejecting, "REJECTED", note.trim())}>
              {t("admin.companies.reject")}
            </Button>
          </>
        }
      >
        <Field label={t("admin.companies.rejectReason")} hint={t("admin.companies.rejectHint")}>
          <textarea rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </Field>
      </Modal>
    </div>
  );
}

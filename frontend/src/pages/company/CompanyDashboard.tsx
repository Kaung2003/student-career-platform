import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";
import type { MessageKey } from "../../i18n/locales/en";
import { api } from "../../lib/api";
import { COMPANY_STATUS_TONE } from "../../lib/company";
import type { Company, CompanyStatus } from "../../lib/types";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { buttonClass } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { GlobeIcon, ShieldIcon } from "../../components/icons";

const STATUS_MESSAGE: Record<CompanyStatus, MessageKey> = {
  PENDING: "company.pendingMessage",
  APPROVED: "company.approvedMessage",
  REJECTED: "company.rejectedMessage",
};

export function CompanyDashboard() {
  const { t } = useI18n();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ company: Company | null }>("/company/me")
      .then((res) => setCompany(res.company))
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={company?.name ?? t("company.panelTitle")} description={t("company.panelDescription")} />

      {company ? (
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <ShieldIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-slate-900 dark:text-white">{t("company.reviewStatus")}</h2>
                <Badge tone={COMPANY_STATUS_TONE[company.status]}>{t(`company.status.${company.status}`)}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t(STATUS_MESSAGE[company.status])}</p>
              {company.status === "REJECTED" && company.reviewNote && (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  {t("company.reason", { reason: company.reviewNote })}
                </p>
              )}
              {company.status === "REJECTED" && (
                <Link to="/company/profile" className={`${buttonClass("primary", "sm")} mt-3`}>
                  {t("company.updateAndResubmit")}
                </Link>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <h2 className="font-semibold text-slate-900 dark:text-white">{t("company.setupTitle")}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("company.setupMessage")}</p>
          <Link to="/company/profile" className={`${buttonClass("primary", "sm")} mt-3`}>
            {t("company.setupButton")}
          </Link>
        </Card>
      )}

      {company && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900 dark:text-white">{t("company.profileTitle")}</h2>
            <Link to="/company/profile" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
              {t("company.edit")}
            </Link>
          </div>
          <a href={company.website} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-1.5 text-sm text-blue-600 hover:underline dark:text-blue-400">
            <GlobeIcon className="h-4 w-4 shrink-0" /> <span className="truncate">{company.website}</span>
          </a>
          {company.description && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">{company.description}</p>}
        </Card>
      )}

      {company?.status === "APPROVED" && (
        <Card>
          <h2 className="font-semibold text-slate-900 dark:text-white">{t("company.searchTitle")}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("company.searchDescription")}</p>
          <Link to="/company/students" className={`${buttonClass("primary", "sm")} mt-3`}>
            {t("company.findStudents")}
          </Link>
        </Card>
      )}

      <Card>
        <h2 className="font-semibold text-slate-900 dark:text-white">{t("company.comingTitle")}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("company.comingMessage")}</p>
      </Card>
    </div>
  );
}

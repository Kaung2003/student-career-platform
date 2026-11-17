import { useState } from "react";
import { useUi } from "../context/UiContext";
import { useI18n } from "../i18n/I18nContext";
import { api, ApiError } from "../lib/api";
import { COMPANY_CHECKS, REQUIRED_CHECKS, type AdminCompany, type CompanyCheck } from "../lib/types";
import { ExternalLinkIcon } from "./icons";

/** Public places an admin can confirm each check. All free; none needs an account. */
function linkFor(check: CompanyCheck, company: AdminCompany): string | null {
  const n = company.corporateNumber;
  switch (check) {
    case "REGISTRY":
      return n ? `https://www.houjin-bangou.nta.go.jp/henkorireki-johoto.html?selHouzinNo=${n}` : null;
    case "INSURANCE":
      return "https://www2.nenkin.go.jp/do/search_section/";
    case "ACTIVITY":
      return n ? `https://info.gbiz.go.jp/hojin/ichiran?hojinBango=${n}` : null;
    case "ADDRESS":
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([company.name, company.location].filter(Boolean).join(" "))}`;
    case "PHONE":
      return company.website;
  }
}

/**
 * The same five checks for every company, so a shell company (ペーパーカンパニー) is hard to approve by mistake.
 * Saved as each box is ticked.
 */
export function CompanyChecklist({ company, onChange }: { company: AdminCompany; onChange: (checks: CompanyCheck[]) => void }) {
  const { t } = useI18n();
  const { toast } = useUi();
  const [saving, setSaving] = useState(false);

  async function toggle(check: CompanyCheck) {
    const next = company.checks.includes(check) ? company.checks.filter((c) => c !== check) : [...company.checks, check];
    setSaving(true);
    try {
      await api.put(`/admin/companies/${company.id}/checks`, { checks: next });
      onChange(next);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("common.somethingWrong"), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 p-3 sm:p-4 dark:border-slate-800">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{t("admin.checks.title")}</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t("admin.checks.description")}</p>
      <ul className="mt-3 space-y-2.5">
        {COMPANY_CHECKS.map((check) => {
          const link = linkFor(check, company);
          const required = REQUIRED_CHECKS.includes(check);
          return (
            <li key={check} className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id={`${company.id}-${check}`}
                checked={company.checks.includes(check)}
                disabled={saving}
                onChange={() => void toggle(check)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
              />
              <div className="min-w-0 text-sm">
                <label htmlFor={`${company.id}-${check}`} className="font-medium text-slate-800 dark:text-slate-200">
                  {t(`admin.checks.${check}`)}
                  {required && <span className="ml-1.5 text-xs font-semibold text-red-600 dark:text-red-400">{t("admin.checks.required")}</span>}
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t(`admin.checks.${check}.how`)}{" "}
                  {link && (
                    <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:underline dark:text-blue-400">
                      {t("admin.checks.open")} <ExternalLinkIcon className="h-3 w-3" />
                    </a>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { api } from "../lib/api";
import type { CompanyView } from "../lib/types";
import { Card } from "./ui/Card";

/** Shows the student which approved companies opened their portfolio. */
export function CompanyViewsCard() {
  const { t, formatDate } = useI18n();
  const [companies, setCompanies] = useState<CompanyView[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .get<{ companies: CompanyView[] }>("/profile/me/company-views")
      .then((res) => setCompanies(res.companies))
      .catch(() => setFailed(true));
  }, []);

  return (
    <Card>
      <h2 className="font-semibold text-slate-900 dark:text-white">{t("companyViews.title")}</h2>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{t("companyViews.description")}</p>

      {failed ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{t("companyViews.loadFailed")}</p>
      ) : companies === null ? null : companies.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{t("companyViews.empty")}</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {companies.map((c) => (
            <li key={c.website + c.name} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5">
              <a href={c.website} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate font-medium text-blue-700 hover:underline dark:text-blue-300">
                {c.name}
              </a>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t("companyViews.detail", { count: c.views, date: formatDate(c.lastViewedAt, { month: "short", day: "numeric" }) })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

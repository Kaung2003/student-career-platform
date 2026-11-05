import { useCallback, useEffect, useState, type SubmitEvent } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";
import { api, ApiError } from "../../lib/api";
import type { StudentSearchResult } from "../../lib/types";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Button, buttonClass } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field, inputClass } from "../../components/ui/Field";
import { Skeleton } from "../../components/ui/Skeleton";
import { ExternalLinkIcon, SearchIcon } from "../../components/icons";

type Filters = { q: string; skills: string; school: string; gradYear: string };
const NO_FILTERS: Filters = { q: "", skills: "", school: "", gradYear: "" };

export function CompanySearch() {
  const { t } = useI18n();
  const [form, setForm] = useState<Filters>(NO_FILTERS);
  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notApproved, setNotApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // What the current results were searched with, so "load more" isn't affected by half-typed filters.
  const [applied, setApplied] = useState<Filters>(NO_FILTERS);

  const fetchPage = useCallback(async (filters: Filters, nextPage: number) => {
    const params = new URLSearchParams({ page: String(nextPage) });
    // Skills can be typed with Japanese commas too.
    const skills = filters.skills.replace(/[、，]/g, ",");
    for (const [key, value] of Object.entries({ ...filters, skills })) {
      if (value.trim()) params.set(key, value.trim());
    }
    setError(null);
    try {
      const res = await api.get<{ students: StudentSearchResult[]; hasMore: boolean }>(`/company/students?${params}`);
      setStudents((current) => (nextPage === 1 ? res.students : [...current, ...res.students]));
      setHasMore(res.hasMore);
      setPage(nextPage);
    } catch (err) {
      if (err instanceof ApiError && err.code === "COMPANY_NOT_APPROVED") setNotApproved(true);
      else setError(err instanceof ApiError ? err.message : t("company.searchFailed"));
    }
  }, [t]);

  useEffect(() => {
    void fetchPage(NO_FILTERS, 1).finally(() => setLoading(false));
  }, [fetchPage]);

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setLoading(true);
    setApplied(form);
    void fetchPage(form, 1).finally(() => setLoading(false));
  }

  function clear() {
    setForm(NO_FILTERS);
    setApplied(NO_FILTERS);
    setLoading(true);
    void fetchPage(NO_FILTERS, 1).finally(() => setLoading(false));
  }

  function loadMore() {
    setLoadingMore(true);
    void fetchPage(applied, page + 1).finally(() => setLoadingMore(false));
  }

  if (notApproved) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title={t("company.searchTitle")} description={t("company.searchDescription")} />
        <Card>
          <h2 className="font-semibold text-slate-900 dark:text-white">{t("company.notApprovedTitle")}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("company.notApprovedMessage")}</p>
          <Link to="/company" className={`${buttonClass("primary", "sm")} mt-3`}>
            {t("company.checkStatus")}
          </Link>
        </Card>
      </div>
    );
  }

  const hasFilters = Object.values(applied).some((value) => value.trim());

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title={t("company.searchTitle")} description={t("company.searchDescription")} />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              maxLength={100}
              aria-label={t("company.searchPlaceholder")}
              placeholder={t("company.searchPlaceholder")}
              value={form.q}
              onChange={(e) => setForm({ ...form, q: e.target.value })}
              className={`${inputClass} pl-11`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("company.filterSkills")}>
              <input maxLength={300} placeholder="React, Python" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className={inputClass} />
            </Field>
            <Field label={t("company.filterSchool")}>
              <input maxLength={120} value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} className={inputClass} />
            </Field>
            <Field label={t("company.filterGradYear")}>
              <input type="number" inputMode="numeric" min={1950} max={2100} value={form.gradYear} onChange={(e) => setForm({ ...form, gradYear: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={loading}>{t("company.searchButton")}</Button>
            {hasFilters && (
              <button type="button" onClick={clear} className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                {t("company.clearFilters")}
              </button>
            )}
          </div>
        </form>
      </Card>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : students.length === 0 && !error ? (
        <EmptyState
          icon={<SearchIcon className="h-6 w-6" />}
          title={t("company.noStudentsTitle")}
          description={t(hasFilters ? "company.noStudentsFiltered" : "company.noStudentsYet")}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {students.map((student) => (
              <Card key={student.slug} className="flex flex-col">
                <div className="flex items-center gap-3">
                  <Avatar name={student.name} size="lg" />
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-900 dark:text-white">{student.name}</h2>
                    {student.headline && <p className="truncate text-sm text-slate-600 dark:text-slate-400">{student.headline}</p>}
                  </div>
                </div>
                {(student.school || student.gradYear) && (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    {[student.school, student.gradYear].filter(Boolean).join(" · ")}
                  </p>
                )}
                {student.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {student.skills.slice(0, 8).map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </div>
                )}
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{t("company.projectCount", { count: student.projectCount })}</span>
                  <a href={`/p/${student.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                    {t("company.viewPortfolio")} <ExternalLinkIcon className="h-4 w-4" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
          {hasMore && (
            <div className="text-center">
              <Button variant="secondary" disabled={loadingMore} onClick={loadMore}>
                {t("company.loadMore")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

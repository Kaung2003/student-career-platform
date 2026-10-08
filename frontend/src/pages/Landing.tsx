import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { IconChip } from "../components/ui/IconChip";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n/I18nContext";
import type { MessageKey } from "../i18n/locales/en";
import { formatNodes } from "../i18n/formatNodes";

const features: { title: MessageKey; description: MessageKey; icon: ReactNode }[] = [
  {
    title: "landing.f1Title",
    description: "landing.f1Desc",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.07 0l2-2a5 5 0 00-7.07-7.07l-1 1M14 11a5 5 0 00-7.07 0l-2 2a5 5 0 007.07 7.07l1-1" />,
  },
  {
    title: "landing.f2Title",
    description: "landing.f2Desc",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path strokeLinecap="round" d="M3 9h18" />
      </>
    ),
  },
  {
    title: "landing.f3Title",
    description: "landing.f3Desc",
    icon: (
      <>
        <circle cx="12" cy="9" r="5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5L7 21l5-2.5L17 21l-2-7.5" />
      </>
    ),
  },
  {
    title: "landing.f4Title",
    description: "landing.f4Desc",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
      />
    ),
  },
  {
    title: "landing.f5Title",
    description: "landing.f5Desc",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />,
  },
  {
    title: "landing.f6Title",
    description: "landing.f6Desc",
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
      </>
    ),
  },
];

const steps: { title: MessageKey; description: MessageKey }[] = [
  { title: "landing.s1Title", description: "landing.s1Desc" },
  { title: "landing.s2Title", description: "landing.s2Desc" },
  { title: "landing.s3Title", description: "landing.s3Desc" },
];

export function Landing() {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-[28rem] max-w-4xl rounded-full bg-gradient-to-tr from-blue-200 via-indigo-100 to-sky-100 opacity-60 blur-3xl dark:from-blue-600/20 dark:via-indigo-500/10 dark:to-sky-500/10" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            {t("landing.badge")}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
            {formatNodes(t("landing.title"), {
              highlight: <span className="text-blue-600 dark:text-blue-400">{t("landing.titleHighlight")}</span>,
            })}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            {t("landing.subtitle")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition hover:bg-blue-700 sm:w-auto"
              >
                {t("landing.goDashboard")}
              </Link>
            ) : (
              <Link
                to="/register"
                className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition hover:bg-blue-700 sm:w-auto"
              >
                {t("landing.getStarted")}
              </Link>
            )}
            <Link
              to="/directory"
              className="w-full rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("landing.browse")}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50 py-20 dark:border-slate-900 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">{t("landing.featuresEyebrow")}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {t("landing.featuresTitle")}
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              {t("landing.featuresSubtitle")}
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <IconChip>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    {feature.icon}
                  </svg>
                </IconChip>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-slate-100">{t(feature.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t(feature.description)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">{t("landing.howEyebrow")}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {t("landing.howTitle")}
            </h2>
          </div>
          <ol className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="relative text-center md:text-left">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white md:mx-0">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-slate-100">{t(step.title)}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t(step.description)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-slate-900 px-6 py-16 text-center sm:px-12 dark:bg-slate-900 dark:ring-1 dark:ring-slate-800">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-600/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
          <h2 className="relative text-3xl font-semibold tracking-tight text-white">{t("landing.ctaTitle")}</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-slate-300">
            {t("landing.ctaSubtitle")}
          </p>
          <Link
            to={user ? "/dashboard" : "/register"}
            className="relative mt-8 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            {user ? t("landing.ctaOpen") : t("landing.ctaCreate")}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

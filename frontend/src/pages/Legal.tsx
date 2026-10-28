import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useI18n } from "../i18n/I18nContext";
import type { MessageKey } from "../i18n/locales/en";

const LAST_UPDATED = "2026-10-26";

const PAGES: Record<"privacy" | "terms", { title: MessageKey; intro: MessageKey; sections: [MessageKey, MessageKey][] }> = {
  privacy: {
    title: "privacy.title",
    intro: "privacy.intro",
    sections: [
      ["privacy.collectTitle", "privacy.collect"],
      ["privacy.useTitle", "privacy.use"],
      ["privacy.aiTitle", "privacy.ai"],
      ["privacy.publicTitle", "privacy.public"],
      ["privacy.controlTitle", "privacy.control"],
      ["privacy.contactTitle", "privacy.contact"],
    ],
  },
  terms: {
    title: "terms.title",
    intro: "terms.intro",
    sections: [
      ["terms.useTitle", "terms.use"],
      ["terms.contentTitle", "terms.content"],
      ["terms.conductTitle", "terms.conduct"],
      ["terms.aiTitle", "terms.ai"],
      ["terms.availabilityTitle", "terms.availability"],
      ["terms.changesTitle", "terms.changes"],
    ],
  },
};

export function Legal({ page }: { page: "privacy" | "terms" }) {
  const { t, formatDate } = useI18n();
  const content = PAGES[page];

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{t(content.title)}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t("legal.updated", { date: formatDate(LAST_UPDATED, { year: "numeric", month: "long", day: "numeric" }) })}
        </p>
        <p className="mt-8 text-lg text-slate-700 dark:text-slate-300">{t(content.intro)}</p>
        <div className="mt-10 space-y-8">
          {content.sections.map(([heading, body]) => (
            <section key={heading}>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t(heading)}</h2>
              <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-400">{t(body)}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

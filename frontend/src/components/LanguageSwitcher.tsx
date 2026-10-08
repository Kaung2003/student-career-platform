import { LANGUAGES, useI18n, type Language } from "../i18n/I18nContext";
import { GlobeIcon } from "./icons";

export function LanguageSwitcher({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const { language, setLanguage, t } = useI18n();

  return (
    <label
      className={`relative inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 ${className}`}
    >
      <GlobeIcon className="pointer-events-none absolute left-2.5 h-4 w-4" />
      <span className="sr-only">{t("common.language")}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        aria-label={t("common.language")}
        className={`cursor-pointer appearance-none rounded-lg bg-transparent py-2 pl-8 text-sm font-medium text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-slate-300 ${
          compact ? "w-[2.25rem] pr-0 text-transparent dark:text-transparent" : "pr-3"
        }`}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="text-slate-900">
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}

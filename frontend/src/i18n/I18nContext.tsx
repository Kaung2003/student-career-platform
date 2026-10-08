import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, type MessageKey } from "./locales/en";

export type Language = "en" | "ja" | "zh" | "es" | "de" | "my";

export const LANGUAGES: { code: Language; label: string; locale: string; englishName: string }[] = [
  { code: "en", label: "English", locale: "en-US", englishName: "English" },
  { code: "ja", label: "日本語", locale: "ja-JP", englishName: "Japanese" },
  { code: "zh", label: "中文", locale: "zh-CN", englishName: "Simplified Chinese" },
  { code: "es", label: "Español", locale: "es-ES", englishName: "Spanish" },
  { code: "de", label: "Deutsch", locale: "de-DE", englishName: "German" },
  { code: "my", label: "မြန်မာ", locale: "my-MM", englishName: "Burmese" },
];

type Messages = Record<MessageKey, string>;

// English ships with the app; other languages are downloaded only when someone picks them.
const LOADERS: Record<Exclude<Language, "en">, () => Promise<Messages>> = {
  ja: () => import("./locales/ja").then((m) => m.ja),
  zh: () => import("./locales/zh").then((m) => m.zh),
  es: () => import("./locales/es").then((m) => m.es),
  de: () => import("./locales/de").then((m) => m.de),
  my: () => import("./locales/my").then((m) => m.my),
};

const STORAGE_KEY = "scp_language";

export type TranslateVars = Record<string, string | number>;
export type Translate = (key: MessageKey, vars?: TranslateVars) => string;

interface I18nContextValue {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: Translate;
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && LANGUAGES.some((l) => l.code === value);
}

function detectLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    // Storage unavailable — fall through to the browser language.
  }
  for (const candidate of navigator.languages ?? [navigator.language]) {
    const base = candidate?.toLowerCase().split("-")[0];
    if (isLanguage(base)) return base;
  }
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage);
  const [messages, setMessages] = useState<{ language: Language; dict: Messages }>({ language: "en", dict: en });
  const locale = LANGUAGES.find((l) => l.code === language)?.locale ?? "en-US";

  useEffect(() => {
    if (language === "en") {
      setMessages({ language: "en", dict: en });
      return;
    }
    let cancelled = false;
    LOADERS[language]()
      .then((dict) => {
        if (!cancelled) setMessages({ language, dict });
      })
      .catch(() => {
        // Network hiccup: keep showing the current language.
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    document.documentElement.lang = messages.language;
  }, [messages.language]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore — the choice still applies for this visit.
    }
  }, [language]);

  const t = useCallback<Translate>(
    (key, vars) => {
      const template = messages.dict[key] ?? en[key] ?? key;
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
    },
    [messages],
  );

  const formatDate = useCallback(
    (value: string | number | Date, options?: Intl.DateTimeFormatOptions) =>
      new Date(value).toLocaleDateString(locale, options),
    [locale],
  );

  const value = useMemo(
    () => ({ language, locale, setLanguage: setLanguageState, t, formatDate }),
    [language, locale, t, formatDate],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}

/** English name of the current language, sent to the API so AI replies match the UI. */
export function aiLanguageName(language: Language): string {
  return LANGUAGES.find((l) => l.code === language)?.englishName ?? "English";
}

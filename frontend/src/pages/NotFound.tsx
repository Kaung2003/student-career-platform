import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useI18n } from "../i18n/I18nContext";

export function NotFound() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 px-4 py-8 sm:px-6 dark:bg-slate-950">
      <Logo />
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          {t("notFound.title")}
        </h1>
        <p className="mt-4 text-slate-600 dark:text-slate-400">{t("notFound.description")}</p>
        <Link
          to="/"
          className="mt-8 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {t("notFound.back")}
        </Link>
      </div>
    </div>
  );
}

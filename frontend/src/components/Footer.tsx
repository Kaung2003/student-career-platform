import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { useI18n } from "../i18n/I18nContext";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {t("footer.tagline")}
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
          <Link to="/directory" className="hover:text-slate-900 dark:hover:text-slate-100">
            {t("footer.discover")}
          </Link>
          <Link to="/register" className="hover:text-slate-900 dark:hover:text-slate-100">
            {t("footer.createAccount")}
          </Link>
          <Link to="/login" className="hover:text-slate-900 dark:hover:text-slate-100">
            {t("common.logIn")}
          </Link>
        </nav>
      </div>
      <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400 dark:border-slate-900 dark:text-slate-500">
        {t("footer.copyright", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}

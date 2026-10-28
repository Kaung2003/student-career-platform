import { Component, type ReactNode } from "react";
import { useI18n } from "../i18n/I18nContext";

function Fallback() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center dark:bg-slate-950">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t("errors.title")}</h1>
      <p className="mt-3 max-w-md text-slate-600 dark:text-slate-400">{t("errors.description")}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        {t("errors.reload")}
      </button>
    </div>
  );
}

/** Shows a friendly screen instead of a blank page when a component crashes. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Unhandled UI error", error);
  }

  render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}

import { useEffect, useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { api } from "../lib/api";
import { CheckIcon } from "./icons";

const COOLDOWN_SECONDS = 60;

/** "We sent you a confirmation link" with a rate-limited resend button. */
export function CheckEmailNotice({ email, compact = false }: { email: string; compact?: boolean }) {
  const { t } = useI18n();
  const [cooldown, setCooldown] = useState(0);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function resend() {
    setCooldown(COOLDOWN_SECONDS);
    await api.post("/auth/resend-verification", { email }).catch(() => {});
    setResent(true);
  }

  return (
    <div
      className={`rounded-xl border border-blue-200 bg-blue-50 text-sm text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100 ${
        compact ? "p-4" : "p-5"
      }`}
    >
      {!compact && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
          <CheckIcon className="h-5 w-5" strokeWidth={2.5} />
        </div>
      )}
      <p className="font-semibold">{t("auth.checkInboxTitle")}</p>
      <p className="mt-1 leading-relaxed">{t("auth.checkInboxBody", { email })}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void resend()}
          disabled={cooldown > 0}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 transition hover:bg-blue-50 disabled:opacity-60 dark:bg-slate-900 dark:text-blue-300 dark:ring-blue-500/30"
        >
          {cooldown > 0 ? t("auth.resendIn", { seconds: cooldown }) : t("auth.resend")}
        </button>
        {resent && cooldown > 0 && <span className="text-xs text-blue-700 dark:text-blue-300">{t("auth.resent")}</span>}
      </div>
      <p className="mt-3 text-xs text-blue-800/70 dark:text-blue-200/70">{t("auth.checkSpam")}</p>
    </div>
  );
}

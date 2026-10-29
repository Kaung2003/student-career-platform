import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { buttonClass } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n/I18nContext";
import { ApiError } from "../lib/api";

/** Opened from the confirmation email: confirms the address and signs the user in. */
export function VerifyEmail() {
  const { verifyEmail } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [error, setError] = useState<string | null>(token ? null : t("auth.verifyInvalid"));
  const started = useRef(false);

  useEffect(() => {
    // Run once, even in React's development double-render: the link only works a single time.
    if (!token || started.current) return;
    started.current = true;
    verifyEmail(token)
      .then(() => navigate("/dashboard?welcome=1", { replace: true }))
      .catch((err) => setError(err instanceof ApiError ? err.message : t("auth.verifyInvalid")));
  }, [token, verifyEmail, navigate, t]);

  return (
    <AuthLayout title={t("auth.verifyTitle")} subtitle={error ? t("auth.verifyFailedSubtitle") : t("auth.verifying")}>
      {error ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
          <Link to="/login" className={`${buttonClass()} w-full py-2.5`}>
            {t("auth.backToLogin")}
          </Link>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">{t("auth.verifyHelp")}</p>
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
        </div>
      )}
    </AuthLayout>
  );
}

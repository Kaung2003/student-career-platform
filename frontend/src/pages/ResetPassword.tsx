import { useState, type SubmitEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { Field, inputClass } from "../components/ui/Field";
import { Button, buttonClass } from "../components/ui/Button";
import { useI18n } from "../i18n/I18nContext";
import { api, ApiError } from "../lib/api";

export function ResetPassword() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t("auth.passwordsDontMatch"));
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.somethingWrong"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title={t("auth.resetTitle")} subtitle={t("auth.resetSubtitle")}>
      {!token ? (
        <p className="text-sm text-red-600 dark:text-red-400">{t("auth.resetInvalid")}</p>
      ) : done ? (
        <div className="space-y-6">
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            {t("auth.resetDone")}
          </p>
          <Link to="/login" className={`${buttonClass()} w-full py-2.5`}>
            {t("common.logIn")}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t("auth.newPassword")} hint={t("auth.passwordPlaceholder")}>
            <input
              type="password"
              required
              minLength={8}
              autoFocus
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t("auth.confirmPassword")}>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
            />
          </Field>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full py-2.5">
            {submitting ? t("common.saving") : t("auth.resetButton")}
          </Button>
        </form>
      )}
      {!done && (
        <p className="mt-6 text-center text-sm">
          <Link to="/forgot-password" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            {t("auth.forgotTitle")}
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}

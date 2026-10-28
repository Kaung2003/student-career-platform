import { useState, type SubmitEvent } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { Field, inputClass } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { CheckIcon } from "../components/icons";
import { useI18n } from "../i18n/I18nContext";
import { api, ApiError } from "../lib/api";

export function ForgotPassword() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSentTo(email.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.somethingWrong"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title={t("auth.forgotTitle")} subtitle={t("auth.forgotSubtitle")}>
      {sentTo ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CheckIcon className="mb-2 h-5 w-5" />
          {t("auth.forgotSent", { email: sentTo })}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t("auth.email")}>
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full py-2.5">
            {submitting ? t("auth.sendingLink") : t("auth.sendLink")}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          {t("auth.backToLogin")}
        </Link>
      </p>
    </AuthLayout>
  );
}

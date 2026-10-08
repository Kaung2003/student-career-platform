import { useState, type SubmitEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n/I18nContext";
import { ApiError } from "../lib/api";
import { AuthLayout } from "../components/AuthLayout";
import { Field, inputClass } from "../components/ui/Field";
import { Button } from "../components/ui/Button";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.loginFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("auth.email")}>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label={t("auth.password")}>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </Field>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full py-2.5">
          {submitting ? t("auth.loggingIn") : t("common.logIn")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        {t("auth.noAccount")}{" "}
        <Link to="/register" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          {t("auth.register")}
        </Link>
      </p>
    </AuthLayout>
  );
}

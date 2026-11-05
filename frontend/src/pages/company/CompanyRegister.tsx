import { useState, type SubmitEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../i18n/I18nContext";
import { ApiError } from "../../lib/api";
import { AuthLayout, COMPANY_PANEL } from "../../components/AuthLayout";
import { CheckEmailNotice } from "../../components/CheckEmailNotice";
import { Field, inputClass } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";

export function CompanyRegister() {
  const { registerCompany } = useAuth();
  const { t } = useI18n();
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      setSentTo(await registerCompany({ companyName, website, name, email, password }));
    } catch (err) {
      if (err instanceof ApiError && err.code === "WORK_EMAIL_REQUIRED") setError(t("company.workEmailRequired"));
      else setError(err instanceof ApiError ? err.message : t("auth.registerFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title={t("company.registerTitle")} subtitle={t("company.registerSubtitle")} panel={COMPANY_PANEL}>
      {sentTo ? (
        <CheckEmailNotice email={sentTo} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t("company.name")}>
            <input required maxLength={120} autoComplete="organization" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t("company.website")}>
            <input required maxLength={300} autoComplete="url" inputMode="url" placeholder="example.co.jp" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t("company.contactName")}>
            <input required maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t("company.workEmail")} hint={t("company.workEmailHint")}>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t("auth.password")}>
            <input type="password" required minLength={8} autoComplete="new-password" placeholder={t("auth.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </Field>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full py-2.5">
            {submitting ? t("auth.creatingAccount") : t("company.registerButton")}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        {t("auth.haveAccount")}{" "}
        <Link to="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          {t("common.logIn")}
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
        {t("company.areYouStudent")}{" "}
        <Link to="/register" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          {t("company.studentSignUp")}
        </Link>
      </p>
    </AuthLayout>
  );
}

import { useEffect, useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useUi } from "../../context/UiContext";
import { useI18n } from "../../i18n/I18nContext";
import { api, ApiError } from "../../lib/api";
import type { Company } from "../../lib/types";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Field, inputClass } from "../../components/ui/Field";
import { Skeleton } from "../../components/ui/Skeleton";

export function CompanyProfile() {
  const { toast } = useUi();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    api
      .get<{ company: Company | null }>("/company/me")
      .then(({ company }) => {
        if (!company) return;
        setName(company.name);
        setWebsite(company.website);
        setIndustry(company.industry ?? "");
        setLocation(company.location ?? "");
        setDescription(company.description ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save(e: SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.put("/company/me", { name, website, industry, location, description });
      toast(t("settings.saved"));
      navigate("/company");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.somethingWrong"));
      setSaving(false);
    }
  }

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("company.profileTitle")} description={t("company.profileDescription")} />
      <Card>
        <form onSubmit={save} className="space-y-4">
          <Field label={t("company.name")} hint={t("company.identityHint")}>
            <input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t("company.website")} hint={t("company.identityHint")}>
            <input required maxLength={300} inputMode="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t("company.industry")}>
            <input maxLength={80} value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t("company.location")}>
            <input maxLength={120} value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t("company.about")}>
            <textarea rows={5} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </Field>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("common.saveChanges")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

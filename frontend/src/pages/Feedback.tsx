import { useState, type SubmitEvent } from "react";
import { useUi } from "../context/UiContext";
import { useI18n } from "../i18n/I18nContext";
import type { MessageKey } from "../i18n/locales/en";
import { api, ApiError } from "../lib/api";
import type { FeedbackType } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/ui/Card";
import { Field, inputClass } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { CheckIcon, MessageSquareIcon, SparklesIcon, XIcon, type IconComponent } from "../components/icons";

const TYPES: { value: FeedbackType; label: MessageKey; description: MessageKey; icon: IconComponent }[] = [
  { value: "BUG", label: "feedback.bugLabel", description: "feedback.bugDescription", icon: XIcon },
  { value: "FEATURE", label: "feedback.featureLabel", description: "feedback.featureDescription", icon: SparklesIcon },
  { value: "COMMENT", label: "feedback.commentLabel", description: "feedback.commentDescription", icon: MessageSquareIcon },
];

export function Feedback() {
  const { toast } = useUi();
  const { t } = useI18n();
  const [type, setType] = useState<FeedbackType>("FEATURE");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.post("/feedback", { type, message: message.trim() });
      setMessage("");
      setSent(true);
      toast(t("feedback.sent"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("feedback.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("feedback.title")} description={t("feedback.description")} />

      {sent ? (
        <Card className="py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckIcon className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{t("feedback.thanksTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("feedback.thanksDescription")}</p>
          <Button variant="secondary" className="mt-6" onClick={() => setSent(false)}>
            {t("feedback.sendMore")}
          </Button>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Field label={t("feedback.kind")}>
              <div className="grid gap-3 sm:grid-cols-3">
                {TYPES.map(({ value, label, description, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={`rounded-xl border p-4 text-left transition ${
                      type === value
                        ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500 dark:bg-blue-500/10"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${type === value ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">{t(label)}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t(description)}</p>
                  </button>
                ))}
              </div>
            </Field>

            <Field label={t("feedback.message")} hint={type === "BUG" ? t("feedback.bugHint") : undefined}>
              <textarea
                rows={6}
                required
                value={message}
                placeholder={t("feedback.messagePlaceholder")}
                onChange={(e) => setMessage(e.target.value)}
                className={inputClass}
              />
            </Field>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting || !message.trim()}>
                {submitting ? t("feedback.sending") : t("feedback.send")}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

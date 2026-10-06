import { useState, type SubmitEvent } from "react";
import { useUi } from "../context/UiContext";
import { api, ApiError } from "../lib/api";
import type { FeedbackType } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/ui/Card";
import { Field, inputClass } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { CheckIcon, MessageSquareIcon, SparklesIcon, XIcon, type IconComponent } from "../components/icons";

const TYPES: { value: FeedbackType; label: string; description: string; icon: IconComponent }[] = [
  { value: "BUG", label: "Report a bug", description: "Something isn't working", icon: XIcon },
  { value: "FEATURE", label: "Suggest a feature", description: "An idea to make it better", icon: SparklesIcon },
  { value: "COMMENT", label: "General feedback", description: "Anything else on your mind", icon: MessageSquareIcon },
];

export function Feedback() {
  const { toast } = useUi();
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
      toast("Thanks — your feedback was sent");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Feedback" description="Found a bug or have an idea? We read every message." />

      {sent ? (
        <Card className="py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckIcon className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Thank you!</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your feedback helps us make the platform better for everyone.</p>
          <Button variant="secondary" className="mt-6" onClick={() => setSent(false)}>
            Send more feedback
          </Button>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Field label="What kind of feedback?">
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
                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Message" hint={type === "BUG" ? "Tell us what you did, what you expected, and what happened instead." : undefined}>
              <textarea
                rows={6}
                required
                value={message}
                placeholder="Share as much detail as you like..."
                onChange={(e) => setMessage(e.target.value)}
                className={inputClass}
              />
            </Field>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting || !message.trim()}>
                {submitting ? "Sending..." : "Send feedback"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

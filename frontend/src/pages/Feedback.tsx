import { useState, type SubmitEvent } from "react";
import { Navbar } from "../components/Navbar";
import { api, ApiError } from "../lib/api";
import type { FeedbackType } from "../lib/types";
import { Card } from "../components/ui/Card";
import { Field, inputClass } from "../components/ui/Field";
import { Button } from "../components/ui/Button";

const TYPE_LABEL: Record<FeedbackType, string> = {
  BUG: "Bug report",
  FEATURE: "Feature suggestion",
  COMMENT: "General comment",
};

export function Feedback() {
  const [type, setType] = useState<FeedbackType>("COMMENT");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      await api.post("/feedback", { type, message: message.trim() });
      setMessage("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Feedback</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Found a bug, or have an idea? Let us know.
        </p>

        <Card className="mt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value as FeedbackType)} className={inputClass}>
                {Object.entries(TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Message">
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={inputClass}
              />
            </Field>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {success && <p className="text-sm text-green-600 dark:text-green-400">Thanks — feedback submitted.</p>}

            <Button type="submit" disabled={submitting || !message.trim()}>
              {submitting ? "Submitting..." : "Submit feedback"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import { api, ApiError } from "../lib/api";
import { useUi } from "../context/UiContext";
import { SparklesIcon } from "./icons";
import { aiLanguageName, useI18n } from "../i18n/I18nContext";

type ImproveKind = "headline" | "bio" | "project";

export function AiImproveButton({
  kind,
  text,
  context,
  onResult,
}: {
  kind: ImproveKind;
  text: string;
  context?: string;
  onResult: (suggestion: string) => void;
}) {
  const { toast } = useUi();
  const { t, language } = useI18n();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await api.post<{ suggestion: string }>("/chat/improve", { kind, text, context, language: aiLanguageName(language) });
      onResult(res.suggestion);
      toast(t("ai.applied"), "info");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("ai.failed"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-violet-600 transition hover:bg-violet-50 disabled:opacity-60 dark:text-violet-400 dark:hover:bg-violet-500/10"
    >
      <SparklesIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
      {loading ? t("ai.writing") : text.trim() ? t("ai.improve") : t("ai.write")}
    </button>
  );
}

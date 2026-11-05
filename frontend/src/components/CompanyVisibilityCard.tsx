import { useState } from "react";
import { useUi } from "../context/UiContext";
import { useI18n } from "../i18n/I18nContext";
import { api, ApiError } from "../lib/api";
import { Card } from "./ui/Card";

/** The student's own switch for appearing in company search. Saves as soon as it's flipped. */
export function CompanyVisibilityCard({ visible, onChange }: { visible: boolean; onChange: (visible: boolean) => void }) {
  const { toast } = useUi();
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    try {
      await api.put("/profile/me/visibility", { visible: !visible });
      onChange(!visible);
      toast(t(visible ? "visibility.turnedOff" : "visibility.turnedOn"));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("visibility.saveFailed"), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-900 dark:text-white">{t("visibility.title")}</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{t("visibility.description")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={visible}
          aria-label={t("visibility.title")}
          disabled={saving}
          onClick={toggle}
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${visible ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`}
        >
          <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${visible ? "translate-x-5" : ""}`} />
        </button>
      </div>
      <p className={`mt-3 text-sm font-medium ${visible ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}>
        {t(visible ? "visibility.on" : "visibility.off")}
      </p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t("visibility.note")}</p>
    </Card>
  );
}

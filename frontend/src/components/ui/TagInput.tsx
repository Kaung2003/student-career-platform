import { useState, type KeyboardEvent } from "react";
import { XIcon } from "../icons";
import { useI18n } from "../../i18n/I18nContext";

export function TagInput({
  value,
  onChange,
  placeholder,
  suggestions = [],
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const existing = new Set(value.map((v) => v.toLowerCase()));
    const next = [...value];
    for (const part of parts) {
      if (!existing.has(part.toLowerCase())) {
        next.push(part);
        existing.add(part.toLowerCase());
      }
    }
    onChange(next);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  const available = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())).slice(0, 8);

  return (
    <div>
      <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-blue-50 py-0.5 pl-2 pr-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={t("common.removeItem", { item: tag })}
              className="rounded p-0.5 hover:bg-blue-100 dark:hover:bg-blue-500/20"
            >
              <XIcon className="h-3 w-3" strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length === 0 ? placeholder : t("common.addMore")}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>
      {available.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 dark:text-slate-500">{t("common.suggestions")}</span>
          {available.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-md border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

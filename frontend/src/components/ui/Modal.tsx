import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "../icons";
import { useI18n } from "../../i18n/I18nContext";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="animate-fade-in absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-pop-in relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-slate-200 sm:rounded-2xl dark:bg-slate-900 dark:ring-slate-800 ${width}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="-mr-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-900/60">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

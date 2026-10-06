import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { CheckIcon, XIcon } from "../components/icons";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface UiContextValue {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const UiContext = createContext<UiContextValue | null>(null);

const toneClass: Record<ToastTone, string> = {
  success: "bg-emerald-500",
  error: "bg-red-500",
  info: "bg-blue-500",
};

export function UiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const nextId = useRef(0);

  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = ++nextId.current;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmState(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function settle(value: boolean) {
    resolver.current?.(value);
    resolver.current = null;
    setConfirmState(null);
  }

  return (
    <UiContext.Provider value={{ toast, confirm }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-pop-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm text-slate-800 shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800"
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${toneClass[t.tone]}`}>
              {t.tone === "error" ? <XIcon className="h-3 w-3" strokeWidth={3} /> : <CheckIcon className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>

      <Modal
        open={confirmState !== null}
        onClose={() => settle(false)}
        title={confirmState?.title ?? ""}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => settle(false)}>
              Cancel
            </Button>
            <Button variant={confirmState?.danger ? "danger" : "primary"} onClick={() => settle(true)}>
              {confirmState?.confirmLabel ?? "Confirm"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">{confirmState?.message ?? "Are you sure?"}</p>
      </Modal>
    </UiContext.Provider>
  );
}

export function useUi(): UiContextValue {
  const ctx = useContext(UiContext);
  if (!ctx) {
    throw new Error("useUi must be used within a UiProvider");
  }
  return ctx;
}

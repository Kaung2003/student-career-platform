import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useI18n } from "../i18n/I18nContext";
import type { FeedbackStatus } from "../lib/types";
import { Avatar } from "./ui/Avatar";
import { InboxIcon, MessageSquareIcon } from "./icons";

interface Notification {
  id: string;
  type: "COMMENT" | "FEEDBACK_UPDATE";
  data: { name?: string; slug?: string; status?: FeedbackStatus };
  readAt: string | null;
  createdAt: string;
}

const POLL_MS = 60_000;

function BellIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />
    </svg>
  );
}

export function NotificationBell({ align = "right" }: { align?: "left" | "right" }) {
  const { t, formatDate } = useI18n();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api
      .get<{ notifications: Notification[]; unread: number }>("/notifications")
      .then((res) => {
        setItems(res.notifications);
        setUnread(res.unread);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function markAllRead() {
    setUnread(0);
    setItems((list) => list.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    void api.post("/notifications/read-all").catch(() => {});
  }

  function describe(n: Notification) {
    if (n.type === "COMMENT") return t("notifications.comment", { name: n.data.name ?? "" });
    const status = n.data.status ? t(`admin.feedbackStatus.${n.data.status}`) : "";
    return t("notifications.feedback", { status });
  }

  function target(n: Notification) {
    return n.type === "COMMENT" && n.data.slug ? `/p/${n.data.slug}` : "/feedback";
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `${t("notifications.title")} (${unread})` : t("notifications.title")}
        className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <BellIcon className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`animate-pop-in absolute top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{t("notifications.title")}</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <InboxIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("notifications.empty")}</p>
              </div>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  to={target(n)}
                  onClick={() => {
                    setOpen(false);
                    if (!n.readAt) {
                      setUnread((u) => Math.max(0, u - 1));
                      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
                      void api.post(`/notifications/${n.id}/read`).catch(() => {});
                    }
                  }}
                  className={`flex gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                    n.readAt ? "" : "bg-blue-50/60 dark:bg-blue-500/5"
                  }`}
                >
                  {n.type === "COMMENT" ? (
                    <Avatar name={n.data.name ?? "?"} size="sm" />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <MessageSquareIcon className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800 dark:text-slate-200">{describe(n)}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{formatDate(n.createdAt, { month: "short", day: "numeric" })}</p>
                  </div>
                  {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

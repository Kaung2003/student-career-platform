import { useState } from "react";
import { Link } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useI18n } from "../i18n/I18nContext";
import { ChatComposer, ChatThread } from "./chat/ChatThread";
import { ExpandIcon, PlusIcon, SparklesIcon, XIcon } from "./icons";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { newChat, active } = useChat();
  const { t } = useI18n();

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {open && (
        <div className="animate-pop-in mb-3 flex h-[min(34rem,calc(100vh-7rem))] w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-[24rem] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-3 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <SparklesIcon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{t("chat.widgetTitle")}</p>
              <p className="text-xs text-white/75">{t("chat.widgetSubtitle")}</p>
            </div>
            {active && (
              <button onClick={newChat} aria-label={t("chat.newChat")} title={t("chat.newChat")} className="rounded-lg p-1.5 hover:bg-white/15">
                <PlusIcon className="h-4 w-4" />
              </button>
            )}
            <Link
              to="/assistant"
              onClick={() => setOpen(false)}
              aria-label={t("chat.openFull")}
              title={t("chat.openFull")}
              className="rounded-lg p-1.5 hover:bg-white/15"
            >
              <ExpandIcon className="h-4 w-4" />
            </Link>
            <button onClick={() => setOpen(false)} aria-label={t("chat.closeChat")} className="rounded-lg p-1.5 hover:bg-white/15">
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <ChatThread compact />
          <ChatComposer compact autoFocus />
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? t("chat.closeWidget") : t("chat.openWidget")}
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg shadow-blue-600/30 transition hover:scale-105"
      >
        {open ? <XIcon className="h-6 w-6" /> : <SparklesIcon className="h-6 w-6" />}
      </button>
    </div>
  );
}

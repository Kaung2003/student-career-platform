import { useState } from "react";
import { useChat } from "../context/ChatContext";
import { useUi } from "../context/UiContext";
import { ChatComposer, ChatThread } from "../components/chat/ChatThread";
import { ClockIcon, MessageSquareIcon, PlusIcon, SparklesIcon, TrashIcon, XIcon } from "../components/icons";

function relativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

function History({ onPick }: { onPick?: () => void }) {
  const { conversations, active, selectChat, deleteChat, newChat } = useChat();
  const { confirm } = useUi();

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <button
          onClick={() => {
            newChat();
            onPick?.();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" /> New chat
        </button>
      </div>
      <p className="px-4 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Recent
      </p>
      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">Your conversations will appear here.</p>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`group flex items-center gap-2 rounded-lg px-3 py-2 transition ${
              active?.id === c.id ? "bg-slate-100 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <button
              onClick={() => {
                selectChat(c.id);
                onPick?.();
              }}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-sm text-slate-800 dark:text-slate-200">{c.title || "New chat"}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                <ClockIcon className="h-3 w-3" /> {relativeTime(c.updatedAt)}
              </p>
            </button>
            <button
              onClick={async () => {
                const ok = await confirm({
                  title: "Delete conversation?",
                  message: "This conversation will be permanently removed from this device.",
                  confirmLabel: "Delete",
                  danger: true,
                });
                if (ok) deleteChat(c.id);
              }}
              aria-label="Delete conversation"
              className="rounded p-1 text-slate-400 opacity-0 transition hover:text-red-600 group-hover:opacity-100 dark:hover:text-red-400"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Assistant() {
  const { active, conversations } = useChat();
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white xl:block dark:border-slate-800 dark:bg-slate-900/50">
        <History />
      </aside>

      {historyOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <div className="animate-fade-in absolute inset-0 bg-slate-950/50" onClick={() => setHistoryOpen(false)} />
          <aside className="animate-pop-in absolute inset-y-0 right-0 w-72 max-w-[85vw] bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Conversations</p>
              <button onClick={() => setHistoryOpen(false)} aria-label="Close" className="rounded p-1 text-slate-500">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <History onPick={() => setHistoryOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 text-white">
              <SparklesIcon className="h-4 w-4" />
            </div>
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {active?.title ?? "AI Career Assistant"}
            </p>
          </div>
          <button
            onClick={() => setHistoryOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 xl:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <MessageSquareIcon className="h-4 w-4" /> History ({conversations.length})
          </button>
        </div>

        <ChatThread />

        <div className="shrink-0 px-4 pb-4 pt-2 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <ChatComposer autoFocus />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { SUGGESTED_PROMPTS, useChat, type ChatMessage } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { Markdown } from "../ui/Markdown";
import { Avatar } from "../ui/Avatar";
import { CheckIcon, CopyIcon, RefreshIcon, SendIcon, SparklesIcon } from "../icons";

function AssistantAvatar({ small }: { small?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 text-white ${
        small ? "h-7 w-7" : "h-8 w-8"
      }`}
    >
      <SparklesIcon className={small ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Message({ message, compact, userName }: { message: ChatMessage; compact: boolean; userName: string }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-3">
        <div
          className={`max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-white ${
            compact ? "text-sm" : "text-[15px]"
          }`}
        >
          {message.content}
        </div>
        {!compact && <Avatar name={userName} size="sm" />}
      </div>
    );
  }

  return (
    <div className="group flex gap-3">
      <AssistantAvatar small={compact} />
      <div className="min-w-0 max-w-[85%]">
        <div
          className={`rounded-2xl rounded-tl-md bg-slate-100 px-4 py-2.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200 ${
            compact ? "text-sm" : "text-[15px]"
          }`}
        >
          <Markdown content={message.content} />
        </div>
        <div className="mt-1 opacity-0 transition group-hover:opacity-100">
          <CopyButton text={message.content} />
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ compact }: { compact: boolean }) {
  return (
    <div className="flex gap-3">
      <AssistantAvatar small={compact} />
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3.5 dark:bg-slate-800">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-bounce-dot h-2 w-2 rounded-full bg-slate-400"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function ChatComposer({ compact = false, autoFocus = false }: { compact?: boolean; autoFocus?: boolean }) {
  const { send, sending, configured } = useChat();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  function submit() {
    if (!input.trim() || sending) return;
    const text = input;
    setInput("");
    void send(text);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  const disabled = configured === false;

  return (
    <div className={compact ? "border-t border-slate-200 p-3 dark:border-slate-800" : ""}>
      <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          disabled={disabled}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={disabled ? "Assistant unavailable" : "Ask anything about your career..."}
          className="max-h-[180px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <button
          onClick={submit}
          disabled={disabled || sending || !input.trim()}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700"
        >
          <SendIcon className="h-4 w-4" />
        </button>
      </div>
      {!compact && (
        <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
          Enter to send · Shift + Enter for a new line · AI can make mistakes, so double-check important details.
        </p>
      )}
    </div>
  );
}

export function ChatThread({ compact = false }: { compact?: boolean }) {
  const { active, sending, error, configured, send, retry } = useChat();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = active?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending, error]);

  if (configured === false) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div>
          <AssistantAvatar />
          <p className="mt-3 font-medium text-slate-900 dark:text-slate-100">Assistant not available</p>
          <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            The AI assistant hasn't been configured on the server yet. Ask the site admin to add a Gemini API key.
          </p>
        </div>
      </div>
    );
  }

  const prompts = compact ? SUGGESTED_PROMPTS.slice(0, 3) : SUGGESTED_PROMPTS;

  return (
    <div ref={scrollRef} className={`flex-1 overflow-y-auto ${compact ? "px-4 py-4" : "px-4 py-8 sm:px-6"}`}>
      <div className={`mx-auto space-y-5 ${compact ? "" : "max-w-3xl"}`}>
        {messages.length === 0 && (
          <div className={compact ? "pt-2" : "pt-8 text-center sm:pt-16"}>
            {!compact && (
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-lg shadow-blue-600/20">
                <SparklesIcon className="h-7 w-7" />
              </div>
            )}
            <h2 className={`font-semibold text-slate-900 dark:text-slate-100 ${compact ? "text-base" : "text-2xl tracking-tight"}`}>
              Hi {user?.name.split(" ")[0]}, how can I help?
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              I know your profile, projects, and certifications — ask me anything about your career.
            </p>
            <div className={`mt-6 grid gap-2 text-left ${compact ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {prompts.map((p) => (
                <button
                  key={p.title}
                  onClick={() => void send(p.prompt)}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500"
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{p.title}</p>
                  {!compact && <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{p.prompt}</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <Message key={i} message={m} compact={compact} userName={user?.name ?? "You"} />
        ))}

        {sending && <TypingIndicator compact={compact} />}

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <span>{error}</span>
            <button
              onClick={() => void retry()}
              className="inline-flex shrink-0 items-center gap-1 font-medium hover:underline"
            >
              <RefreshIcon className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

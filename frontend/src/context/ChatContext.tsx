import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { api, ApiError, streamEvents } from "../lib/api";
import { useAuth } from "./AuthContext";
import { aiLanguageName, useI18n } from "../i18n/I18nContext";
import type { MessageKey } from "../i18n/locales/en";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
}

interface ActiveConversation {
  id: string | null;
  title: string | null;
  messages: ChatMessage[];
}

interface ChatContextValue {
  configured: boolean | null;
  conversations: Conversation[];
  active: ActiveConversation | null;
  loadingConversation: boolean;
  sending: boolean;
  error: string | null;
  send: (text: string) => Promise<void>;
  retry: () => Promise<void>;
  stop: () => void;
  newChat: () => void;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

interface ServerConversation {
  id: string;
  title: string;
  updatedAt: string;
}

const toConversation = (c: ServerConversation): Conversation => ({
  id: c.id,
  title: c.title,
  updatedAt: new Date(c.updatedAt).getTime(),
});

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<ActiveConversation | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    setActive(null);
    setError(null);
    if (!user) {
      setConversations([]);
      setConfigured(null);
      return;
    }
    api
      .get<{ configured: boolean }>("/chat/status")
      .then((res) => setConfigured(res.configured))
      .catch(() => setConfigured(false));
    api
      .get<{ conversations: ServerConversation[] }>("/chat/conversations")
      .then((res) => setConversations(res.conversations.map(toConversation)))
      .catch(() => setConversations([]));
  }, [user]);

  const run = useCallback(
    async (text: string, conversationId: string | null, isRetry: boolean) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setSending(true);
      setError(null);

      // Placeholder the reply streams into.
      setActive((a) => ({
        id: a?.id ?? conversationId,
        title: a?.title ?? null,
        messages: [...(a?.messages ?? []), { role: "assistant", content: "" }],
      }));

      const appendToReply = (chunk: string) =>
        setActive((a) => {
          if (!a) return a;
          const messages = [...a.messages];
          const last = messages[messages.length - 1];
          if (last?.role === "assistant") messages[messages.length - 1] = { ...last, content: last.content + chunk };
          return { ...a, messages };
        });

      let failed: string | null = null;
      try {
        await streamEvents(
          "/chat/stream",
          { conversationId: conversationId ?? undefined, message: text, language: aiLanguageName(language), retry: isRetry },
          (event, payload) => {
            if (event === "meta") {
              const id = String(payload["conversationId"]);
              const title = String(payload["title"]);
              setActive((a) => (a ? { ...a, id, title } : a));
              setConversations((list) => [{ id, title, updatedAt: Date.now() }, ...list.filter((c) => c.id !== id)]);
            } else if (event === "delta") {
              appendToReply(String(payload["text"] ?? ""));
            } else if (event === "error") {
              failed = String(payload["error"] ?? t("chat.error"));
            }
          },
          controller.signal,
        );
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          failed = err instanceof ApiError ? err.message : t("chat.error");
        }
      } finally {
        setSending(false);
        abortRef.current = null;
      }

      if (failed) {
        setError(failed);
        // Drop the empty or partial reply; the user's message stays so Retry can resend it.
        setActive((a) => (a ? { ...a, messages: a.messages.filter((m, i) => !(i === a.messages.length - 1 && m.role === "assistant")) } : a));
      }
    },
    [language, t],
  );

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || sending) return;
      const conversationId = active?.id ?? null;
      setActive((a) => ({
        id: a?.id ?? null,
        title: a?.title ?? null,
        messages: [...(a?.messages ?? []), { role: "user", content: text }],
      }));
      await run(text, conversationId, false);
    },
    [active?.id, run, sending],
  );

  const retry = useCallback(async () => {
    if (!active || sending) return;
    const last = active.messages[active.messages.length - 1];
    if (!last || last.role !== "user") return;
    await run(last.content, active.id, active.id !== null);
  }, [active, run, sending]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setActive(null);
    setError(null);
  }, []);

  const selectChat = useCallback((id: string) => {
    abortRef.current?.abort();
    setError(null);
    setLoadingConversation(true);
    setActive({ id, title: null, messages: [] });
    api
      .get<{ conversation: ServerConversation; messages: { role: "USER" | "ASSISTANT"; content: string }[] }>(
        `/chat/conversations/${id}`,
      )
      .then((res) =>
        setActive({
          id,
          title: res.conversation.title,
          messages: res.messages.map((m) => ({ role: m.role === "USER" ? "user" : "assistant", content: m.content })),
        }),
      )
      .catch(() => setError(t("chat.error")))
      .finally(() => setLoadingConversation(false));
  }, [t]);

  const deleteChat = useCallback(
    async (id: string) => {
      await api.delete(`/chat/conversations/${id}`);
      setConversations((list) => list.filter((c) => c.id !== id));
      if (active?.id === id) setActive(null);
    },
    [active?.id],
  );

  return (
    <ChatContext.Provider
      value={{
        configured,
        conversations,
        active,
        loadingConversation,
        sending,
        error,
        send,
        retry,
        stop,
        newChat,
        selectChat,
        deleteChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return ctx;
}

export const SUGGESTED_PROMPTS: { title: MessageKey; prompt: MessageKey }[] = [
  { title: "chat.p1Title", prompt: "chat.p1Prompt" },
  { title: "chat.p2Title", prompt: "chat.p2Prompt" },
  { title: "chat.p3Title", prompt: "chat.p3Prompt" },
  { title: "chat.p4Title", prompt: "chat.p4Prompt" },
  { title: "chat.p5Title", prompt: "chat.p5Prompt" },
  { title: "chat.p6Title", prompt: "chat.p6Prompt" },
];

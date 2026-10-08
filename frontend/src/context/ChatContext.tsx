import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, ApiError } from "../lib/api";
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
  messages: ChatMessage[];
  updatedAt: number;
}

interface ChatContextValue {
  configured: boolean | null;
  conversations: Conversation[];
  active: Conversation | null;
  sending: boolean;
  error: string | null;
  send: (text: string) => Promise<void>;
  retry: () => Promise<void>;
  newChat: () => void;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const MAX_CONVERSATIONS = 30;

function storageKey(userId: string) {
  return `scp_chats_${userId}`;
}

function loadConversations(userId: string): Conversation[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    const parsed = raw ? (JSON.parse(raw) as Conversation[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function makeTitle(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      loadedFor.current = null;
      setConversations([]);
      setActiveId(null);
      setConfigured(null);
      return;
    }
    const loaded = loadConversations(user.id);
    loadedFor.current = user.id;
    setConversations(loaded);
    setActiveId(loaded[0]?.id ?? null);
    api
      .get<{ configured: boolean }>("/chat/status")
      .then((res) => setConfigured(res.configured))
      .catch(() => setConfigured(false));
  }, [user]);

  useEffect(() => {
    if (!user || loadedFor.current !== user.id) return;
    try {
      localStorage.setItem(storageKey(user.id), JSON.stringify(conversations.slice(0, MAX_CONVERSATIONS)));
    } catch {
      // Storage full or unavailable — chats still work for this session.
    }
  }, [conversations, user]);

  const active = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);

  const request = useCallback(async (conversationId: string, history: ChatMessage[], text: string) => {
    setSending(true);
    setError(null);
    try {
      const res = await api.post<{ reply: string }>("/chat/message", {
        message: text,
        history,
        language: aiLanguageName(language),
      });
      setConversations((list) =>
        list.map((c) =>
          c.id === conversationId
            ? { ...c, messages: [...c.messages, { role: "assistant", content: res.reply }], updatedAt: Date.now() }
            : c,
        ),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("chat.error"));
    } finally {
      setSending(false);
    }
  }, [language, t]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || sending) return;

      let conversation = active;
      if (!conversation) {
        conversation = { id: crypto.randomUUID(), title: makeTitle(text), messages: [], updatedAt: Date.now() };
        const created = conversation;
        setConversations((list) => [created, ...list]);
        setActiveId(created.id);
      }

      const history = conversation.messages;
      const id = conversation.id;
      setConversations((list) => {
        const updated = list.map((c) =>
          c.id === id
            ? {
                ...c,
                title: c.messages.length === 0 ? makeTitle(text) : c.title,
                messages: [...c.messages, { role: "user" as const, content: text }],
                updatedAt: Date.now(),
              }
            : c,
        );
        return updated.sort((a, b) => b.updatedAt - a.updatedAt);
      });

      await request(id, history, text);
    },
    [active, request, sending],
  );

  const retry = useCallback(async () => {
    if (!active || sending) return;
    const last = active.messages[active.messages.length - 1];
    if (!last || last.role !== "user") return;
    await request(active.id, active.messages.slice(0, -1), last.content);
  }, [active, request, sending]);

  const newChat = useCallback(() => {
    setActiveId(null);
    setError(null);
  }, []);

  const selectChat = useCallback((id: string) => {
    setActiveId(id);
    setError(null);
  }, []);

  const deleteChat = useCallback(
    (id: string) => {
      setConversations((list) => list.filter((c) => c.id !== id));
      if (activeId === id) setActiveId(null);
    },
    [activeId],
  );

  return (
    <ChatContext.Provider
      value={{ configured, conversations, active, sending, error, send, retry, newChat, selectChat, deleteChat }}
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

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "./AuthContext";

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
      const res = await api.post<{ reply: string }>("/chat/message", { message: text, history });
      setConversations((list) =>
        list.map((c) =>
          c.id === conversationId
            ? { ...c, messages: [...c.messages, { role: "assistant", content: res.reply }], updatedAt: Date.now() }
            : c,
        ),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the assistant. Check your connection.");
    } finally {
      setSending(false);
    }
  }, []);

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

export const SUGGESTED_PROMPTS = [
  { title: "Review my profile", prompt: "Review my profile and tell me the three most important things to improve for recruiters." },
  { title: "Write a resume bullet", prompt: "Help me turn one of my projects into a strong resume bullet point using the XYZ formula." },
  { title: "Mock interview", prompt: "Run a short mock interview with me. Ask one question at a time and give feedback after each answer." },
  { title: "Plan my next steps", prompt: "Based on my skills, suggest a 30-day plan to become a stronger candidate for internships." },
  { title: "Cover letter", prompt: "Help me draft a concise cover letter for an entry-level role. Ask me what you need to know first." },
  { title: "Which certification?", prompt: "Which certifications would be most valuable for me right now, and why?" },
];

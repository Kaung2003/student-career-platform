import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, clearLegacyToken } from "../lib/api";
import type { User } from "../lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Creates the account and emails a confirmation link; returns the address it was sent to. */
  register: (name: string, email: string, password: string) => Promise<string>;
  loginWithGoogle: (credential: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthResponse {
  user: User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The session cookie is invisible to JavaScript, so just ask the server who we are.
    api
      .get<User>("/auth/me")
      .then((me) => {
        setUser(me);
        clearLegacyToken();
      })
      .catch(() => {
        setUser(null);
        clearLegacyToken();
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<AuthResponse>("/auth/login", { email, password });
    clearLegacyToken();
    setUser(res.user);
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.post<{ verificationRequired: true; email: string }>("/auth/register", { name, email, password });
    return res.email;
  }

  async function loginWithGoogle(credential: string) {
    const res = await api.post<AuthResponse>("/auth/google", { credential });
    clearLegacyToken();
    setUser(res.user);
  }

  async function verifyEmail(token: string) {
    const res = await api.post<AuthResponse>("/auth/verify-email", { token });
    clearLegacyToken();
    setUser(res.user);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      clearLegacyToken();
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, verifyEmail, logout, updateUser: setUser }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

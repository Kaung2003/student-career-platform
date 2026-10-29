import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useI18n } from "../i18n/I18nContext";
import { api, ApiError } from "../lib/api";

// Google Identity Services: Google shows its own button and popup, then hands us a signed ID token.

interface GoogleIdApi {
  initialize: (options: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: "popup" }) => void;
  renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

const GOOGLE_LOCALES: Record<string, string> = { en: "en", ja: "ja", zh: "zh_CN", es: "es", de: "de", my: "my" };

let scriptPromise: Promise<void> | null = null;
function loadGoogleScript() {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Google script failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

let configPromise: Promise<string | null> | null = null;
function loadClientId() {
  configPromise ??= api
    .get<{ googleClientId: string | null }>("/auth/config")
    .then((c) => c.googleClientId)
    .catch(() => {
      configPromise = null;
      return null;
    });
  return configPromise;
}

/** Renders "Sign in with Google" plus an "or" divider; renders nothing if Google isn't configured. */
export function GoogleSignInButton({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const { loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const container = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Latest handler without re-rendering Google's button every time the page re-renders.
  const onCredential = useRef<(credential: string) => Promise<void>>(async () => {});
  onCredential.current = async (credential: string) => {
    setError(null);
    setBusy(true);
    try {
      await loginWithGoogle(credential);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.googleFailed"));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void loadClientId().then(setClientId);
  }, []);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        const el = container.current;
        const google = window.google?.accounts.id;
        if (cancelled || !el || !google) return;

        google.initialize({
          client_id: clientId,
          ux_mode: "popup",
          callback: ({ credential }) => void onCredential.current(credential),
        });

        el.innerHTML = "";
        google.renderButton(el, {
          type: "standard",
          theme: theme === "dark" ? "filled_black" : "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          width: Math.min(el.offsetWidth || 360, 400),
          locale: GOOGLE_LOCALES[language] ?? "en",
        });
      })
      .catch(() => setError(t("auth.googleUnavailable")));

    return () => {
      cancelled = true;
    };
    // t only changes with language, which is already a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, theme, language]);

  if (!clientId) return null;

  return (
    <div className="mb-6">
      <div ref={container} className={`flex min-h-[44px] w-full justify-center ${busy ? "pointer-events-none opacity-60" : ""}`} />
      {error && <p className="mt-2 text-center text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        {t("auth.orWithEmail")}
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

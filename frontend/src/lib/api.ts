// Sessions live in an httpOnly cookie set by the API, so no token is ever stored in JavaScript.
// Older sessions kept a token in localStorage; it is sent once so the server can move it to a cookie.
const LEGACY_TOKEN_KEY = "scp_token";

function legacyToken(): string | null {
  try {
    return localStorage.getItem(LEGACY_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearLegacyToken(): void {
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    // Storage unavailable — nothing to clear.
  }
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function buildInit(options: RequestInit = {}): RequestInit {
  const token = legacyToken();
  const isFormData = options.body instanceof FormData;
  return {
    ...options,
    credentials: "same-origin",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, buildInit(options));
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, body.error ?? "Something went wrong");
  }

  return body as T;
}

const json = (data?: unknown) => (data !== undefined ? JSON.stringify(data) : undefined);

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: "POST", body: json(data) }),
  put: <T>(path: string, data?: unknown) => request<T>(path, { method: "PUT", body: json(data) }),
  patch: <T>(path: string, data?: unknown) => request<T>(path, { method: "PATCH", body: json(data) }),
  delete: <T>(path: string, data?: unknown) => request<T>(path, { method: "DELETE", body: json(data) }),
  upload: <T>(path: string, formData: FormData) => request<T>(path, { method: "POST", body: formData }),
};

/**
 * POSTs and reads a server-sent-event stream, calling onEvent for each `event:`/`data:` pair.
 * Works whether the response arrives chunk by chunk or all at once.
 */
export async function streamEvents(
  path: string,
  data: unknown,
  onEvent: (event: string, payload: Record<string, unknown>) => void,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...buildInit({ method: "POST", body: json(data) }), ...(signal ? { signal } : {}) });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? "Something went wrong");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const flush = (block: string) => {
    const event = /^event: (.+)$/m.exec(block)?.[1];
    const payload = /^data: (.+)$/m.exec(block)?.[1];
    if (event && payload) onEvent(event, JSON.parse(payload));
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let index;
    while ((index = buffer.indexOf("\n\n")) !== -1) {
      flush(buffer.slice(0, index));
      buffer = buffer.slice(index + 2);
    }
  }
  if (buffer.trim()) flush(buffer);
}

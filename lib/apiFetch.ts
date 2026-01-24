export async function apiFetch(url: string, options?: RequestInit) {
  // Client-side helper: attach Pi accessToken if present.
  // This avoids relying on cookies (often flaky on iOS Pi Browser).
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("pi_access_token");
  }

  const baseHeaders: Record<string, string> = {
    ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options?.headers as any),
  };

  if (token && !("Authorization" in baseHeaders)) {
    baseHeaders["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    // Keep cookies as fallback, but don't depend on them.
    credentials: "include",
    headers: baseHeaders,
  });
}

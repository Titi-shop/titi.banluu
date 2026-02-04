let cachedToken: string | null = null;
let authPromise: Promise<string> | null = null;

export async function getPiAccessToken(): Promise<string> {
  // ✅ Nếu đã có token → dùng luôn
  if (cachedToken) {
    return cachedToken;
  }

  // ✅ Chặn gọi authenticate song song
  if (authPromise) {
    return authPromise;
  }

  if (typeof window === "undefined" || !window.Pi) {
    throw new Error("PI_NOT_AVAILABLE");
  }

  const scopes = ["username", "payments"];

  authPromise = (async () => {
    const auth = await window.Pi.authenticate(scopes, () => {});

    if (!auth?.accessToken) {
      authPromise = null;
      throw new Error("PI_AUTH_FAILED");
    }

    cachedToken = auth.accessToken;
    authPromise = null;
    return cachedToken;
  })();

  return authPromise;
}

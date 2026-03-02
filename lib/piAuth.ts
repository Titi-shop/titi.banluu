let cachedToken: string | null = null;
let authPromise: Promise<string> | null = null;

export async function getPiAccessToken(): Promise<string> {
  if (authPromise) {
    return authPromise;
  }

  if (typeof window === "undefined" || !window.Pi) {
    throw new Error("PI_NOT_AVAILABLE");
  }

  const scopes = ["username", "payments"];

  authPromise = (async () => {
    try {
      const auth = await window.Pi.authenticate(scopes, () => {});

      if (!auth?.accessToken) {
        throw new Error("PI_AUTH_FAILED");
      }

      cachedToken = auth.accessToken;
      return cachedToken;
    } finally {
      authPromise = null;
    }
  })();

  return authPromise;
}

/* 🔥 Quan trọng: thêm function này */
export function clearPiToken() {
  cachedToken = null;
}

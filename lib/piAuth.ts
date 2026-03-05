let cachedToken: string | null = null;
let authPromise: Promise<string> | null = null;

/* =========================
   CLIENT: Get Pi access token
========================= */
export async function getPiAccessToken(): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }

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

/* =========================
   SERVER: Verify Pi token
========================= */
export async function verifyPiToken(token: string) {
  const res = await fetch("https://api.minepi.com/v2/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("PI_TOKEN_INVALID");
  }

  return res.json();
}

/* =========================
   Clear cached token
========================= */
export function clearPiToken() {
  cachedToken = null;
}

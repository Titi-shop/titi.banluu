let cachedToken: string | null = null;
let authPromise: Promise<string> | null = null;

/* =========================
   CLIENT: GET ACCESS TOKEN
========================= */

export async function getPiAccessToken(): Promise<string> {
  if (authPromise) return authPromise;

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
   SERVER: VERIFY TOKEN
========================= */

export type PiUser = {
  uid: string;
  username: string;
};

export async function verifyPiToken(token: string): Promise<PiUser> {
  if (!token) {
    throw new Error("PI_TOKEN_MISSING");
  }

  const res = await fetch("https://api.minepi.com/v2/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("PI_TOKEN_INVALID");
  }

  const data = await res.json();

  return {
    uid: data.uid,
    username: data.username,
  };
}

/* ========================= */

export function clearPiToken() {
  cachedToken = null;
}

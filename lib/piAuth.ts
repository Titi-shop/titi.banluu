/* =========================================================
   Pi Auth Utility
   - Client: get accessToken từ Pi Browser
   - Server: verify accessToken với Pi API
========================================================= */

let cachedToken: string | null = null;
let authPromise: Promise<string> | null = null;

/* =========================================================
   CLIENT: GET PI ACCESS TOKEN
========================================================= */

export async function getPiAccessToken(): Promise<string> {

  // dùng cache để tránh gọi authenticate nhiều lần
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

      if (!auth || !auth.accessToken) {
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

/* =========================================================
   SERVER: VERIFY PI TOKEN
========================================================= */

export type PiUser = {
  pi_uid: string;
  username: string;
};

export async function verifyPiToken(token: string): Promise<PiUser> {

  if (!token) {
    throw new Error("PI_TOKEN_MISSING");
  }

  const res = await fetch(
    "https://api.minepi.com/v2/me",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("PI_TOKEN_INVALID");
  }

  const data = await res.json() as {
    uid: string;
    username: string;
  };

  if (!data.uid) {
    throw new Error("PI_USER_INVALID");
  }

  return {
    pi_uid: data.uid,
    username: data.username,
  };
}

/* =========================================================
   CLEAR TOKEN (LOGOUT)
========================================================= */

export function clearPiToken(): void {
  cachedToken = null;
}

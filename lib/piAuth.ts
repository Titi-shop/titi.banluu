let authPromise: Promise<string> | null = null;

export async function getPiAccessToken(): Promise<string> {

  if (authPromise) return authPromise;

  if (typeof window === "undefined" || !window.Pi) {
    throw new Error("PI_NOT_AVAILABLE");
  }

  const scopes = ["username", "payments"];

  authPromise = (async () => {

    const auth = await window.Pi.authenticate(scopes, () => {});

    if (!auth?.accessToken) {
      throw new Error("PI_AUTH_FAILED");
    }

    return auth.accessToken;

  })();

  return authPromise;
}

/* ============================= */

export type PiUser = {
  pi_uid: string
  username: string
}

export async function verifyPiToken(token: string): Promise<PiUser> {

  const res = await fetch(
    "https://api.minepi.com/v2/me",
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    }
  );

  if (!res.ok) {
    throw new Error("PI_TOKEN_INVALID");
  }

  const data = await res.json();

  return {
    pi_uid: data.uid,
    username: data.username
  };
}

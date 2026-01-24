import { headers } from "next/headers";

/**
 * Verify Pi accessToken by calling Pi Network /v2/me
 * - Pi Network = Identity Provider
 * - NETWORK–FIRST (Bearer token)
 * - NO COOKIE
 */
export type PiVerifiedUser = {
  pi_uid: string;
  username: string;
  wallet_address?: string | null;
};

export async function verifyPiTokenFromRequest(): Promise<PiVerifiedUser | null> {
  const h = headers();

  // 🔐 Read Authorization header (case-safe)
  const auth =
    h.get("authorization") ||
    h.get("Authorization") ||
    "";

  if (!auth.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = auth.slice(7).trim();
  if (!token) return null;

  let res: Response;
  try {
    res = await fetch("https://api.minepi.com/v2/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("❌ Pi Network fetch error:", err);
    }
    return null;
  }

  if (!res.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("⚠️ Pi token invalid:", res.status);
    }
    return null;
  }

  const data = (await res.json()) as any;

  if (!data?.uid || !data?.username) {
    return null;
  }

  return {
    pi_uid: String(data.uid),
    username: String(data.username),
    wallet_address: data.wallet_address ?? null,
  };
}

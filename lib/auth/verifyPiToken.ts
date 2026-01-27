import { headers } from "next/headers";

/**
 * Pi Network user payload (from /v2/me)
 * DO NOT trust blindly – must validate at runtime
 */
type PiApiUser = {
  uid: string;
  username: string;
  wallet_address?: string | null;
};

/**
 * Internal verified user (used by Auth / RBAC)
 */
export type PiVerifiedUser = {
  pi_uid: string;
  username: string;
  wallet_address: string | null;
};

/**
 * Runtime type guard for Pi API response
 */
function isPiApiUser(data: unknown): data is PiApiUser {
  if (typeof data !== "object" || data === null) return false;

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.uid === "string" &&
    typeof obj.username === "string" &&
    ("wallet_address" in obj
      ? typeof obj.wallet_address === "string" || obj.wallet_address === null
      : true)
  );
}

/**
 * Verify Pi accessToken by calling Pi Network /v2/me
 * - Pi Network = Identity Provider
 * - NETWORK–FIRST (Authorization: Bearer)
 * - NO COOKIE
 */
export async function verifyPiTokenFromRequest(): Promise<PiVerifiedUser | null> {
  const h = headers();

  // 🔐 Read Authorization header (case-insensitive safe)
  const auth =
    h.get("authorization") ??
    h.get("Authorization") ??
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

  const raw: unknown = await res.json();

  if (!isPiApiUser(raw)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("⚠️ Invalid Pi API response shape:", raw);
    }
    return null;
  }

  return {
    pi_uid: raw.uid,
    username: raw.username,
    wallet_address: raw.wallet_address ?? null,
  };
}

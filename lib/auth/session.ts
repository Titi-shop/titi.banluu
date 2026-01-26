// lib/auth/session.ts
// ⚠️ TYPE ONLY — NO RUNTIME LOGIC — NO COOKIES

export type SessionUser = {
  /** Pi UID */
  pi_uid: string;

  /** Pi username */
  username?: string;

  /** Pi wallet address */
  wallet_address?: string | null;
};

/**
 * Legacy cookie session (may be blocked on iOS Pi Browser).
 * Keep for backward compatibility, but new auth should prefer Bearer token.
 */
export function getSessionUser(): SessionUser | null {
  const raw = cookies().get("pi_user")?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    const pi_uid = parsed?.uid ?? parsed?.pi_uid;
    if (!pi_uid) return null;

    return {
      pi_uid: String(pi_uid),
      username: parsed?.username,
      wallet_address: parsed?.wallet_address ?? null,
    };
  } catch {
    return null;
  }
}

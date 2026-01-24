import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { resolveRole } from "./resolveRole";
import type { Role } from "./role";
import { getSessionUser, type SessionUser } from "./session";
import { verifyPiTokenFromRequest, type PiVerifiedUser } from "./verifyPiToken";

/**
 * Auth model:
 * - Preferred: Authorization: Bearer <Pi accessToken> (NETWORK-FIRST)
 * - Fallback: cookie session (for Android/older flows)
 * - DB is source of truth for RBAC role (public.users.role)
 */
export type AuthUser = SessionUser & { username: string; wallet_address?: string | null };

async function ensureUserRow(user: { pi_uid: string; username: string; wallet_address?: string | null }) {
  // Make sure FK to products/orders works (users row exists)
  await query(
    `
    INSERT INTO public.users (pi_uid, username)
    VALUES ($1, $2)
    ON CONFLICT (pi_uid) DO UPDATE
      SET username = EXCLUDED.username
    `,
    [user.pi_uid, user.username]
  ).catch(() => {});
}

async function getAuthUser(): Promise<AuthUser | null> {
  // 1) Bearer first
  const verified: PiVerifiedUser | null = await verifyPiTokenFromRequest();
  if (verified) {
    await ensureUserRow(verified);
    return {
      pi_uid: verified.pi_uid,
      username: verified.username,
      wallet_address: verified.wallet_address ?? null,
    };
  }

  // 2) Cookie fallback
  const session = getSessionUser();
  if (session?.pi_uid) {
    // username might be missing in old cookie; keep empty string guard
    const u = { pi_uid: session.pi_uid, username: session.username ?? "" };
    if (u.username) await ensureUserRow(u);
    return { ...session, username: session.username ?? "" };
  }

  return null;
}

export async function requireAuth() {
  const user = await getAuthUser();

  if (!user?.pi_uid) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }),
    };
  }

  const role = await resolveRole(user);

  return { ok: true as const, user, role };
}

export async function requireSeller() {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  if (auth.role !== "seller" && auth.role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }),
    };
  }

  return auth;
}

export function hasRole(role: Role, allowed: Role[]): boolean {
  return allowed.includes(role);
}

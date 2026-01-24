import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { resolveRole } from "./resolveRole";
import type { Role } from "./role";
import { verifyPiTokenFromRequest, type PiVerifiedUser } from "./verifyPiToken";

/**
 * AUTH MODEL (FINAL):
 * - Pi Network = Identity Provider
 * - NETWORK–FIRST (Authorization: Bearer <Pi accessToken>)
 * - NO COOKIE
 * - DB (public.users) = source of truth for RBAC
 */

export type AuthUser = {
  pi_uid: string;
  username: string;
  wallet_address?: string | null;
};

async function ensureUserRow(user: PiVerifiedUser) {
  await query(
    `
    INSERT INTO public.users (pi_uid, username)
    VALUES ($1, $2)
    ON CONFLICT (pi_uid)
    DO UPDATE SET username = EXCLUDED.username
    `,
    [user.pi_uid, user.username]
  );
}

async function getAuthUser(): Promise<AuthUser | null> {
  const verified = await verifyPiTokenFromRequest();
  if (!verified) return null;

  await ensureUserRow(verified);

  return {
    pi_uid: verified.pi_uid,
    username: verified.username,
    wallet_address: verified.wallet_address ?? null,
  };
}

export async function requireAuth() {
  const user = await getAuthUser();

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401 }
      ),
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
      response: NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      ),
    };
  }

  return auth;
}

export function hasRole(role: Role, allowed: Role[]): boolean {
  return allowed.includes(role);
}

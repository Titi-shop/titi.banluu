import { NextResponse } from "next/server";
import { resolveRole } from "./resolveRole";
import type { Role } from "./role";
import { getUserFromBearer } from "./getUserFromBearer";
import type { AuthUser } from "./types";

/**
 * AUTH MODEL (FINAL – CHUẨN):
 * - Pi Network = Identity Provider
 * - NETWORK–FIRST
 * - AUTH–CENTRIC (SINGLE ENTRYPOINT)
 * - NO COOKIE
 * - RBAC = DB FIRST
 */

export async function requireAuth() {
  const user = await getUserFromBearer();

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "UNAUTHORIZED" },
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

export async function requireCustomer() {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  if (auth.role !== "customer") {
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

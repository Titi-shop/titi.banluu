/* =========================================================
   app/api/users/role/route.ts
   - NETWORK–FIRST Pi Auth
   - Bearer ONLY (NO cookie)
   - ADMIN only (Bootstrap tool)
========================================================= */

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { headers } from "next/headers";
import { resolveRole } from "@/lib/auth/resolveRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   TYPES
========================= */
type UserRole = "customer" | "seller" | "admin";

type PiUser = {
  pi_uid: string;
  username: string;
  wallet_address?: string | null;
};

/* =========================
   AUTH — PI BEARER
========================= */
async function getUserFromBearer(): Promise<PiUser | null> {
  const auth = headers().get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.slice(7).trim();
  if (!token) return null;

  const res = await fetch("https://api.minepi.com/v2/me", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!data?.uid) return null;

  return {
    pi_uid: String(data.uid),
    username: String(data.username ?? ""),
    wallet_address: data.wallet_address ?? null,
  };
}

/* =========================
   GET — CURRENT USER ROLE
========================= */
export async function GET() {
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const role = await resolveRole(user);

  return NextResponse.json({
    success: true,
    role,
  });
}

/* =========================
   POST — ADMIN SET ROLE
========================= */
export async function POST(req: Request) {
  const admin = await getUserFromBearer();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const myRole = await resolveRole(admin);
  if (myRole !== "admin") {
    return NextResponse.json(
      { success: false, error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  try {
    const body = (await req.json()) as {
      uid?: string;
      role?: UserRole;
    };

    if (
      typeof body?.uid !== "string" ||
      !["customer", "seller", "admin"].includes(body.role ?? "")
    ) {
      return NextResponse.json(
        { success: false, error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    await kv.set(`user_role:${body.uid}`, body.role);

    return NextResponse.json({
      success: true,
      uid: body.uid,
      role: body.role,
    });
  } catch (err) {
    console.error("❌ SET ROLE ERROR:", err);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

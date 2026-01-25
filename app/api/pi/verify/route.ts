// app/api/pi/verify/route.ts
/* =========================================================
   PI TOKEN VERIFY API
   - Identity Provider: Pi Network
   - NETWORK–FIRST
   - AUTH-CENTRIC
   - NO COOKIE
   - BOOTSTRAP MODE (Phase 1)
========================================================= */

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */
type PiMeResponse = {
  uid?: string;
  username?: string;
  wallet_address?: string | null;
};

/* =========================================================
   BLOCK UNSUPPORTED METHODS (avoid noisy logs)
========================================================= */
export async function GET() {
  return new Response("Method Not Allowed", { status: 405 });
}

/* =========================================================
   POST /api/pi/verify
========================================================= */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const accessToken = body?.accessToken as string | undefined;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "MISSING_ACCESS_TOKEN" },
        { status: 400 }
      );
    }

    /* =====================================================
       1️⃣ VERIFY TOKEN WITH PI NETWORK (NETWORK-FIRST)
    ===================================================== */
    const piRes = await fetch("https://api.minepi.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!piRes.ok) {
      return NextResponse.json(
        { success: false, error: "INVALID_ACCESS_TOKEN" },
        { status: 401 }
      );
    }

    const data = (await piRes.json()) as PiMeResponse;

    if (!data?.uid || !data?.username) {
      return NextResponse.json(
        { success: false, error: "INVALID_PI_USER" },
        { status: 401 }
      );
    }

    const pi_uid = String(data.uid);
    const username = String(data.username);
    const wallet_address = data.wallet_address ?? null;

    /* =====================================================
       2️⃣ UPSERT USER (DB = SOURCE OF TRUTH)
       - Bootstrap: only ensure existence
    ===================================================== */
    await query(
      `
      INSERT INTO public.users (pi_uid, username)
      VALUES ($1, $2)
      ON CONFLICT (pi_uid)
      DO UPDATE SET username = EXCLUDED.username
      `,
      [pi_uid, username]
    );

    /* =====================================================
       3️⃣ RESOLVE ROLE (DB FIRST)
       - Bootstrap default = customer
    ===================================================== */
    const { rows } = await query(
      `
      SELECT role
      FROM public.users
      WHERE pi_uid = $1
      LIMIT 1
      `,
      [pi_uid]
    );

    const dbRole = rows?.[0]?.role;
    const role =
      dbRole === "seller" || dbRole === "admin" || dbRole === "customer"
        ? dbRole
        : "customer";

    /* =====================================================
       4️⃣ RETURN VERIFIED SESSION (NO COOKIE)
    ===================================================== */
    return NextResponse.json({
      success: true,
      user: {
        pi_uid,
        username,
        wallet_address,
        role,
      },
    });
  } catch (err) {
    console.error("❌ PI VERIFY ERROR:", err);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

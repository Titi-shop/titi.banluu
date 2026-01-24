// app/api/pi/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PiMeResponse = {
  uid?: string;
  username?: string;
  wallet_address?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = (await req.json()) as { accessToken?: string };

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "missing_access_token" },
        { status: 400 }
      );
    }

    /* =====================================================
       1️⃣ VERIFY TOKEN WITH PI NETWORK
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
        { success: false, error: "invalid_access_token" },
        { status: 401 }
      );
    }

    const data = (await piRes.json()) as PiMeResponse;

    if (!data.uid || !data.username) {
      return NextResponse.json(
        { success: false, error: "invalid_pi_user" },
        { status: 401 }
      );
    }

    const pi_uid = String(data.uid);
    const username = String(data.username);
    const wallet_address = data.wallet_address ?? null;

    /* =====================================================
       2️⃣ UPSERT USER (DB = SOURCE OF TRUTH)
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
       3️⃣ RESOLVE ROLE FROM DB
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

    const role =
      rows?.[0]?.role === "seller" ||
      rows?.[0]?.role === "admin" ||
      rows?.[0]?.role === "customer"
        ? rows[0].role
        : "customer";

    /* =====================================================
       4️⃣ RETURN AUTH RESULT (NO COOKIE)
    ===================================================== */
    return NextResponse.json({
      success: true,
      user: {
        pi_uid,
        username,
        wallet_address,
        role, // 🔥 QUAN TRỌNG
      },
    });
  } catch (err) {
    console.error("❌ PI VERIFY ERROR:", err);
    return NextResponse.json(
      { success: false, error: "server_error" },
      { status: 500 }
    );
  }
}

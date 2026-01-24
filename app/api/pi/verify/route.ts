import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "missing_access_token" },
        { status: 400 }
      );
    }

    // 🔐 Verify with Pi Network
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

    const data = await piRes.json();

    if (!data?.uid || !data?.username) {
      return NextResponse.json(
        { success: false, error: "invalid_pi_user" },
        { status: 401 }
      );
    }

    // ✅ DB = source of truth
    await query(
      `
      insert into users (pi_uid, username, role)
      values ($1, $2, 'seller')
      on conflict (pi_uid)
      do update set username = excluded.username
      `,
      [data.uid, data.username]
    );

    // ❌ KHÔNG SET COOKIE
    return NextResponse.json({
      success: true,
      user: {
        uid: data.uid,
        username: data.username,
        wallet_address: data.wallet_address ?? null,
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

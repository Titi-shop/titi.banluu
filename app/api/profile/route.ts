// app/api/profile/route.ts

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPiTokenFromRequest } from "@/lib/auth/verifyPiToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   GET /api/profile
========================= */
export async function GET() {
  const user = await verifyPiTokenFromRequest();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const { rows } = await query(
    `SELECT * FROM user_profile WHERE uid = $1 LIMIT 1`,
    [user.pi_uid]
  );

  return NextResponse.json({
    success: true,
    profile:
      rows[0] ?? {
        display_name: "",
        avatar: null,
        email: "",
        phone: "",
        address: "",
        province: "",
        country: "",
      },
  });
}

/* =========================
   POST /api/profile
========================= */
export async function POST(req: Request) {
  const user = await verifyPiTokenFromRequest();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));

  await query(
    `
    INSERT INTO user_profile (
      uid, username, display_name, avatar,
      email, phone, address, province, country,
      created_at, updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
    ON CONFLICT (uid) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      avatar = EXCLUDED.avatar,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      province = EXCLUDED.province,
      country = EXCLUDED.country,
      updated_at = NOW()
    `,
    [
      user.pi_uid,
      user.username,
      body.display_name ?? "",
      body.avatar ?? null,
      body.email ?? "",
      body.phone ?? "",
      body.address ?? "",
      body.province ?? "",
      body.country ?? "",
    ]
  );

  return NextResponse.json({ success: true });
}

// app/api/profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUserFromBearer(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.slice(7);

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
    pi_uid: data.uid as string,
    username: data.username ?? "",
  };
}

/* =========================
   GET /api/profile
========================= */
export async function GET(req: NextRequest) {
  const user = await getUserFromBearer(req);

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
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
        country: "VN",
      },
  });
}

/* =========================
   POST /api/profile
========================= */
export async function POST(req: NextRequest) {
  const user = await getUserFromBearer(req);

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
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
      body.country ?? "VN",
    ]
  );

  return NextResponse.json({ success: true });
}

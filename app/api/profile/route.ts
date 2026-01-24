import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuthUser = {
  uid: string;
  username: string;
};

async function getAuthUser(): Promise<AuthUser | null> {
  // Cookie FIRST
  const raw = cookies().get("pi_user")?.value;
  if (raw) {
    try {
      return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    } catch {}
  }

  // Bearer fallback (PI-NETWORK–FIRST)
  const auth = headers().get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    const res = await fetch("https://api.minepi.com/v2/me", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.uid && data?.username) {
        return { uid: data.uid, username: data.username };
      }
    }
  }

  return null;
}

/* GET /api/profile */
export async function GET() {
  const auth = await getAuthUser();

  if (!auth) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const { rows } = await query(
    `SELECT * FROM user_profile WHERE uid = $1 LIMIT 1`,
    [auth.uid]
  );

  return NextResponse.json({
    success: true,
    profile: rows[0] ?? {
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

/* POST /api/profile */
export async function POST(req: Request) {
  const auth = await getAuthUser(); // ✅ FIX

  if (!auth) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const profile = {
    display_name: body.display_name ?? "",
    avatar: body.avatar ?? null,
    email: body.email ?? "",
    phone: body.phone ?? "",
    address: body.address ?? "",
    province: body.province ?? "",
    country: body.country ?? "",
  };

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
      auth.uid,
      auth.username,
      profile.display_name,
      profile.avatar,
      profile.email,
      profile.phone,
      profile.address,
      profile.province,
      profile.country,
    ]
  );

  return NextResponse.json({ success: true, profile });
}

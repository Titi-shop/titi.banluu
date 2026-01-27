import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   TYPES (NO any)
========================= */
interface ProfileRow {
  display_name: string | null;
  avatar: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  province: string | null;
  country: string | null;
}

/* =========================
   GET /api/profile
========================= */
export async function GET(req: Request) {
  const user = await getUserFromBearer(req);
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { rows } = await query<ProfileRow>(
    `
    SELECT
      display_name,
      avatar,
      email,
      phone,
      address,
      province,
      country
    FROM user_profile
    WHERE uid = $1
    LIMIT 1
    `,
    [user.pi_uid]
  );

  const profile: ProfileRow = rows[0] ?? {
    display_name: null,
    avatar: null,
    email: null,
    phone: null,
    address: null,
    province: null,
    country: "VN",
  };

  return NextResponse.json({
    success: true,
    profile,
  });
}

/* =========================
   POST /api/profile
========================= */
export async function POST(req: Request) {
  const user = await getUserFromBearer(req);
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const raw: unknown = await req.json().catch(() => null);

  if (typeof raw !== "object" || raw === null) {
    return NextResponse.json(
      { error: "INVALID_BODY" },
      { status: 400 }
    );
  }

  const body = raw as Record<string, unknown>;

  // ✅ NORMALIZE INPUT
  const display_name =
    typeof body.display_name === "string"
      ? body.display_name.trim()
      : "";

  const email =
    typeof body.email === "string"
      ? body.email.trim()
      : "";

  const phone =
    typeof body.phone === "string"
      ? body.phone.trim()
      : "";

  const address =
    typeof body.address === "string"
      ? body.address.trim()
      : "";

  const province =
    typeof body.province === "string"
      ? body.province.trim()
      : "";

  const country =
    typeof body.country === "string" && body.country
      ? body.country
      : "VN";

  const avatar =
    typeof body.avatar === "string"
      ? body.avatar
      : null;

  await query(
    `
    INSERT INTO user_profile (
      uid,
      username,
      display_name,
      avatar,
      email,
      phone,
      address,
      province,
      country,
      created_at,
      updated_at
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
      display_name,
      avatar,
      email,
      phone,
      address,
      province,
      country,
    ]
  );

  return NextResponse.json({ success: true });
}

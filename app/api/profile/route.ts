import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function emptyProfile() {
  return {
    full_name: null,
    email: null,
    phone: null,
    avatar_url: null,
    bio: null,
    country: "VN",
    province: null,
    district: null,
    ward: null,
    address_line: null,
    postal_code: null,
    shop_name: null,
    shop_slug: null,
    shop_description: null,
    shop_banner: null,
  };
}

/* =========================
   GET /api/profile
========================= */
export async function GET() {
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const { rows } = await query(
      `
      SELECT *
      FROM user_profiles
      WHERE user_id = $1
      LIMIT 1
      `,
      [user.pi_uid] // ✅ SỬA ĐÚNG
    );

    const profile = rows[0] ?? emptyProfile();

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (err) {
    console.error("PROFILE GET ERROR:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

/* =========================
   POST /api/profile
========================= */
export async function POST(req: Request) {
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const raw: unknown = await req.json().catch(() => null);
  if (typeof raw !== "object" || raw === null) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const body = raw as Record<string, unknown>;

  const normalize = (v: unknown, max: number) =>
    typeof v === "string" ? v.trim().slice(0, max) : null;

  const full_name = normalize(body.full_name, 100);
  const email = normalize(body.email, 100);
  const phone = normalize(body.phone, 20);
  const bio = normalize(body.bio, 500);

  const country =
    typeof body.country === "string" && body.country
      ? body.country.trim().slice(0, 50)
      : "VN";

  const province = normalize(body.province, 100);
  const district = normalize(body.district, 100);
  const ward = normalize(body.ward, 100);
  const address_line = normalize(body.address_line, 255);
  const postal_code = normalize(body.postal_code, 20);

  const avatar_url =
    typeof body.avatar_url === "string" ? body.avatar_url : null;

  const shop_name = normalize(body.shop_name, 150);
  const shop_slug =
    typeof body.shop_slug === "string"
      ? body.shop_slug.trim().toLowerCase().slice(0, 150)
      : null;

  const shop_description = normalize(body.shop_description, 1000);
  const shop_banner =
    typeof body.shop_banner === "string" ? body.shop_banner : null;

  try {
    await query(
      `
      INSERT INTO user_profiles (
        user_id,
        full_name,
        email,
        phone,
        avatar_url,
        bio,
        country,
        province,
        district,
        ward,
        address_line,
        postal_code,
        shop_name,
        shop_slug,
        shop_description,
        shop_banner,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
        NOW(),NOW()
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        avatar_url = EXCLUDED.avatar_url,
        bio = EXCLUDED.bio,
        country = EXCLUDED.country,
        province = EXCLUDED.province,
        district = EXCLUDED.district,
        ward = EXCLUDED.ward,
        address_line = EXCLUDED.address_line,
        postal_code = EXCLUDED.postal_code,
        shop_name = EXCLUDED.shop_name,
        shop_slug = EXCLUDED.shop_slug,
        shop_description = EXCLUDED.shop_description,
        shop_banner = EXCLUDED.shop_banner,
        updated_at = NOW()
      `,
      [
        user.pi_uid, // ✅ SỬA ĐÚNG
        full_name,
        email,
        phone,
        avatar_url,
        bio,
        country,
        province,
        district,
        ward,
        address_line,
        postal_code,
        shop_name,
        shop_slug,
        shop_description,
        shop_banner,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PROFILE SAVE ERROR:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

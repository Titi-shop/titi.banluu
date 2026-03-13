import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { query } from "@/lib/db";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    // ==============================
    // 🔐 AUTH
    // ==============================
    const user = await getUserFromBearer(req);

    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // ==============================
    // 📥 READ FILE
    // ==============================
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "INVALID_FILE" },
        { status: 400 }
      );
    }

    // ==============================
    // 📄 LOAD CURRENT BANNER
    // ==============================
    const result = await query<{ shop_banner: string | null }>(
      `SELECT shop_banner FROM user_profiles WHERE user_id = $1`,
      [user.pi_uid]
    );

    const oldBanner =
      result.rows.length > 0 ? result.rows[0].shop_banner : null;

    // ==============================
    // 🗑 DELETE OLD BANNER
    // ==============================
    if (oldBanner) {
      try {
        const url = new URL(oldBanner);
        await del(url.pathname);
      } catch (err) {
        console.warn("⚠️ Failed to delete old banner:", err);
      }
    }

    // ==============================
    // ☁️ UPLOAD NEW BANNER
    // ==============================
    const blob = await put(
      `shop-banners/${user.pi_uid}-${Date.now()}`,
      file,
      {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }
    );

    // ==============================
    // 💾 UPDATE PROFILE
    // ==============================
    await query(
      `
      INSERT INTO user_profiles (user_id, shop_banner, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        shop_banner = EXCLUDED.shop_banner,
        updated_at = NOW()
      `,
      [user.pi_uid, blob.url]
    );

    // ==============================
    // ✅ RESPONSE
    // ==============================
    return NextResponse.json({
      success: true,
      banner: `${blob.url}?t=${Date.now()}`,
    });
  } catch (err) {
    console.error("❌ UPLOAD SHOP BANNER ERROR:", err);

    return NextResponse.json(
      { error: "UPLOAD_FAILED" },
      { status: 500 }
    );
  }
}

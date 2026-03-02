// app/api/uploadAvatar/route.ts
import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { query } from "@/lib/db";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/uploadAvatar
 * Auth: Authorization: Bearer <Pi accessToken>
 * Body: multipart/form-data (file)
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    // ==============================
    // 🔐 AUTH (PI NETWORK)
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
    // 📄 LOAD CURRENT AVATAR
    // ==============================
    const result = await query<{
      avatar_url: string | null;
    }>(
      `SELECT avatar_url FROM user_profiles WHERE user_id = $1`,
      [user.pi_uid]
    );

    const oldAvatarUrl =
      result.rows.length > 0 ? result.rows[0].avatar_url : null;

    // ==============================
    // 🗑 DELETE OLD AVATAR
    // ==============================
    if (oldAvatarUrl) {
      try {
        // ⚠️ del() cần pathname, không phải full URL
        const url = new URL(oldAvatarUrl);
        await del(url.pathname);
      } catch (err) {
        console.warn("⚠️ Failed to delete old avatar:", err);
      }
    }

    // ==============================
    // ☁️ UPLOAD NEW AVATAR
    // ==============================
    const blob = await put(
      `avatars/${user.pi_uid}-${Date.now()}`,
      file,
      {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }
    );

    // ==============================
    // 💾 UPSERT DB
    // ==============================
    await query(
      `
      INSERT INTO user_profiles (user_id, username, avatar_url, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW()
      `,
      [user.pi_uid, user.username, blob.url]
    );

    // ==============================
    // ✅ RESPONSE (CACHE BUST)
    // ==============================
    return NextResponse.json({
      success: true,
      avatar: `${blob.url}?t=${Date.now()}`,
    });
  } catch (err) {
    console.error("❌ UPLOAD AVATAR ERROR:", err);
    return NextResponse.json(
      { error: "UPLOAD_FAILED" },
      { status: 500 }
    );
  }
}

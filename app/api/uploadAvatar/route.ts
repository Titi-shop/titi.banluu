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
    // 🔐 AUTH – PI NETWORK (NETWORK-FIRST)
    // ==============================
    const user = await getUserFromBearer();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // ==============================
    // 📥 READ FORM DATA
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
    // 📄 LOAD CURRENT PROFILE
    // ==============================
    const result = await query<{
      avatar: string | null;
    }>(
      `SELECT avatar FROM user_profile WHERE uid = $1`,
      [user.pi_uid]
    );

    const oldAvatarUrl: string | null =
      result.rows.length > 0 ? result.rows[0].avatar : null;

    // ==============================
    // 🗑️ DELETE OLD AVATAR (IF EXISTS)
    // ==============================
    if (oldAvatarUrl) {
      try {
        await del(oldAvatarUrl);
      } catch (err) {
        console.warn("⚠️ Failed to delete old avatar:", err);
      }
    }

    // ==============================
    // ☁️ UPLOAD NEW AVATAR
    // ==============================
    const blob = await put(
      `avatars/${user.pi_uid}-${Date.now()}.jpg`,
      file,
      {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }
    );

    // ==============================
    // 💾 SAVE TO DB
    // ==============================
    await query(
      `
      INSERT INTO user_profile (uid, username, avatar, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (uid)
      DO UPDATE SET
        avatar = EXCLUDED.avatar,
        updated_at = NOW()
      `,
      [user.pi_uid, user.username, blob.url]
    );

    // ==============================
    // ✅ RESPONSE (CACHE-BUST)
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

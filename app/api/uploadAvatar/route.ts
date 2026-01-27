// app/api/uploadAvatar/route.ts
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { query } from "@/lib/db";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getUserFromBearer();
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "MISSING_FILE" }, { status: 400 });
    }

    const blob = await put(
      `avatars/${user.pi_uid}.jpg`,
      file,
      {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        allowOverwrite: true, // ⭐ BẮT BUỘC
      }
    );

    await query(
      `
      INSERT INTO user_profile (uid, username, avatar, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (uid)
      DO UPDATE SET avatar = EXCLUDED.avatar, updated_at = NOW()
      `,
      [user.pi_uid, user.username, blob.url]
    );

    // ⭐ TRẢ URL CÓ CACHE-BUST
    return NextResponse.json({
      success: true,
      avatar: `${blob.url}?t=${Date.now()}`,
    });
  } catch (err) {
    console.error("❌ UPLOAD AVATAR ERROR:", err);
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }
}

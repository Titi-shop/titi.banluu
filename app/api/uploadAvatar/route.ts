import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { put } from "@vercel/blob";
import { query } from "@/lib/db";

export const runtime = "nodejs";

async function getPiUser() {
  const auth = headers().get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.slice(7).trim();
  const res = await fetch("https://api.minepi.com/v2/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.uid) return null;

  return { uid: data.uid, username: data.username };
}

export async function POST(req: Request) {
  try {
    const user = await getPiUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Missing file" },
        { status: 400 }
      );
    }

    // Upload blob
    const blob = await put(
      `avatars/${user.uid}.jpg`,
      file,
      {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }
    );

    // Update DB (source of truth)
    await query(
      `
      INSERT INTO user_profile (uid, username, avatar, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (uid)
      DO UPDATE SET avatar = EXCLUDED.avatar, updated_at = NOW()
      `,
      [user.uid, user.username, blob.url]
    );

    return NextResponse.json({ success: true, avatar: blob.url });
  } catch (err) {
    console.error("❌ Upload avatar error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

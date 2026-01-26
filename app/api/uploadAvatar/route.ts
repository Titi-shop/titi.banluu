/* =========================================================
   app/api/uploadAvatar/route.ts
   - NETWORK–FIRST Pi Auth
   - Bearer token only
   - Upload avatar via Vercel Blob
   - Phase 1 (Bootstrap) safe
========================================================= */

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { query } from "@/lib/db";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   PI AUTH — BEARER ONLY (NO COOKIE)
========================================================= */
async function getUserFromBearer() {
  const authHeader = headers().get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

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
    pi_uid: String(data.uid),
    username: String(data.username ?? ""),
    wallet_address: data.wallet_address ?? null,
  };
}

/* =========================================================
   POST /api/uploadAvatar
========================================================= */
export async function POST(req: Request) {
  try {
    /* 1️⃣ AUTH */
    const user = await getUserFromBearer();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    /* 2️⃣ READ FILE */
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "MISSING_FILE" },
        { status: 400 }
      );
    }

    /* 3️⃣ UPLOAD TO VERCEL BLOB */
    const blob = await put(
      `avatars/${user.pi_uid}.jpg`,
      file,
      {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }
    );

    /* 4️⃣ UPSERT DB (BOOTSTRAP SAFE) */
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

    /* 5️⃣ RESPONSE */
    return NextResponse.json({
      success: true,
      avatar: blob.url,
    });
  } catch (err) {
    console.error("❌ UPLOAD AVATAR ERROR:", err);
    return NextResponse.json(
      { error: "UPLOAD_FAILED" },
      { status: 500 }
    );
  }
}

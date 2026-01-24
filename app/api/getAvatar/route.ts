import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

export const runtime = "nodejs";

/* =========================
   AUTH CORE (GIỐNG PROFILE)
========================= */
function getAuthUser() {
  const raw = cookies().get("pi_user")?.value;
  if (!raw) return null;

  try {
    const json = Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/* =========================
   GET /api/getAvatar
========================= */
export async function GET() {
  const auth = getAuthUser();

  if (!auth?.uid) {
    return NextResponse.json({ avatar: null }, { status: 200 });
  }

  const { rows } = await query<{ avatar: string | null }>(
    `SELECT avatar FROM user_profile WHERE uid = $1 LIMIT 1`,
    [auth.uid]
  );

  return NextResponse.json({
    avatar: rows[0]?.avatar ?? null,
  });
}

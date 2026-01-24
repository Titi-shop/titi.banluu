import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { resolveRole } from "@/lib/auth/resolveRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   TYPES
========================= */
type BaseUser = {
  uid: string;
  username: string;
  wallet_address?: string | null;
};

/* =========================
   PI TOKEN FIRST (BẮT BUỘC)
========================= */
async function getUserFromPiToken(): Promise<BaseUser | null> {
  const auth = headers().get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.slice(7).trim();
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
  if (!data?.uid || !data?.username) return null;

  return {
    uid: data.uid,
    username: data.username,
    wallet_address: data.wallet_address ?? null,
  };
}

/* =========================
   COOKIE FALLBACK (DESKTOP)
========================= */

function getUserFromCookie(): BaseUser | null {
  try {
    const raw = cookies().get("pi_user")?.value;
    if (!raw) return null;

    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));

    if (!parsed?.uid || !parsed?.username) return null;

    return {
      uid: parsed.uid,
      username: parsed.username,
      wallet_address: parsed.wallet_address ?? null,
    };
  } catch (err) {
    console.error("❌ COOKIE PARSE ERROR:", err);
    return null;
  }
}
/* =========================
   GET /api/users/me
========================= */
export async function GET() {
  // 🔑 PI FIRST → COOKIE SAU
  const baseUser =
    (await getUserFromPiToken()) ??
    getUserFromCookie();

  if (!baseUser) {
    return NextResponse.json(
      { success: false },
      { status: 401 }
    );
  }

  const role = await resolveRole(baseUser);

  return NextResponse.json({
    success: true,
    user: {
      ...baseUser,
      role,
    },
  });
}

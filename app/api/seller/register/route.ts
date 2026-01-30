import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function headers() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   POST /api/seller/register
========================= */
export async function POST() {
  /* 1️⃣ AUTH */
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  /* 2️⃣ CHECK ROLE */
  const role = await resolveRole(user);
  if (role === "seller" || role === "admin") {
    return NextResponse.json({
      success: true,
      role,
    });
  }

  /* 3️⃣ UPDATE ROLE (SAFE) */
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/users?pi_uid=eq.${user.pi_uid}`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ role: "seller" }),
    }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "FAILED_TO_REGISTER_SELLER" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    role: "seller",
  });
}

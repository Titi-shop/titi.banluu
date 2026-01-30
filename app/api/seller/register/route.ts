import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function supabaseHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

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

  /* 2️⃣ RBAC */
  const role = await resolveRole(user);
  if (role === "seller" || role === "admin") {
    return NextResponse.json({
      success: true,
      role,
    });
  }

  /* 3️⃣ UPDATE ROLE */
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/users?pi_uid=eq.${user.pi_uid}`,
    {
      method: "PATCH",
      headers: supabaseHeaders(),
      body: JSON.stringify({ role: "seller" }),
    }
  );

  if (!res.ok) {
    console.error("SELLER REGISTER FAIL", await res.text());
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

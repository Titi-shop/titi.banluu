import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function POST() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json(
      { error: "SERVER_MISCONFIGURED" },
      { status: 500 }
    );
  }

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
      message: "ALREADY_SELLER",
    });
  }

  /* 3️⃣ INSERT SELLER REQUEST (PENDING) */
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/seller_requests`,
    {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify({
        pi_uid: user.pi_uid,
        username: user.username,
        status: "pending",
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Supabase error:", text);

    // 👉 thường là do index uniq_seller_request_pending
    return NextResponse.json(
      { error: "REQUEST_ALREADY_PENDING" },
      { status: 409 }
    );
  }

  return NextResponse.json({
    success: true,
    status: "pending",
  });
}

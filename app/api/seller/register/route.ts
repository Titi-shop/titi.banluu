import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =====================================================
   Helper: Supabase REST headers (Service Role)
===================================================== */
function supabaseHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
}

export async function POST() {
  try {
    /* 0️⃣ ENV CHECK */
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json(
        { error: "SERVER_MISCONFIGURED" },
        { status: 500 }
      );
    }

    /* 1️⃣ AUTH (Bearer token) */
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

    /* 3️⃣ CHECK EXISTING PENDING REQUEST */
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/seller_requests?pi_uid=eq.${user.pi_uid}&status=eq.pending&select=id`,
      {
        method: "GET",
        headers: supabaseHeaders(),
      }
    );

    if (!checkRes.ok) {
      const text = await checkRes.text();
      console.error("CHECK ERROR:", text);
      return NextResponse.json(
        { error: "CHECK_FAILED" },
        { status: 500 }
      );
    }

    const existing = await checkRes.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { error: "REQUEST_ALREADY_PENDING" },
        { status: 409 }
      );
    }

    /* 4️⃣ INSERT SELLER REQUEST */
    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/seller_requests`,
      {
        method: "POST",
        headers: supabaseHeaders(),
        body: JSON.stringify({
          pi_uid: user.pi_uid,
          username: user.username ?? null,
          status: "pending",
        }),
      }
    );

    if (!insertRes.ok) {
      const text = await insertRes.text();
      console.error("INSERT ERROR:", text);
      return NextResponse.json(
        { error: "INSERT_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: "pending",
    });
  } catch (err) {
    console.error("SELLER REGISTER FATAL:", err);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    /* 3️⃣ READ BODY */
    let body: unknown = null;

try {
  const text = await req.text();
  body = text ? JSON.parse(text) : null;
} catch {
  return NextResponse.json(
    { error: "INVALID_JSON" },
    { status: 400 }
  );
}

    const {
      shop_name,
      shop_description,
      phone,
      email,
    } = body as {
      shop_name: unknown;
      shop_description?: unknown;
      phone?: unknown;
      email?: unknown;
    };

    if (typeof shop_name !== "string" || shop_name.trim() === "") {
      return NextResponse.json(
        { error: "SHOP_NAME_REQUIRED" },
        { status: 400 }
      );
    }

    /* 4️⃣ CHECK EXISTING PENDING */
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/seller_requests?user_id=eq.${user.pi_uid}&status=eq.pending&select=id`,
      {
        method: "GET",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      }
    );

    if (!checkRes.ok) {
      return NextResponse.json(
        { error: "CHECK_FAILED" },
        { status: 500 }
      );
    }

    const existing: unknown = await checkRes.json();

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { error: "REQUEST_ALREADY_PENDING" },
        { status: 409 }
      );
    }

    /* 5️⃣ INSERT */
    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/seller_requests`,
      {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          user_id: user.pi_uid,
          username: user.username,
          shop_name: shop_name.trim(),
          shop_description:
            typeof shop_description === "string"
              ? shop_description
              : null,
          phone: typeof phone === "string" ? phone : null,
          email: typeof email === "string" ? email : null,
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

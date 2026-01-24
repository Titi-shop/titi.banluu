import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "pi_user";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 ngày

/* ============================================================
   🔹 HELPER: BUILD COOKIE (PI BROWSER SAFE)
============================================================ */
function buildCookie(value: string, maxAge = COOKIE_MAX_AGE) {
  return [
    `pi_user=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",   // 🔥 QUAN TRỌNG
    // ❌ KHÔNG set Domain
    // ❌ KHÔNG cần Secure khi Lax
    `Max-Age=${maxAge}`,
  ].join("; ");
}

/* ============================================================
   🔹 GET — FETCH SESSION (DEBUG / CLIENT CHECK)
============================================================ */
export function GET(req: NextRequest) {
  const raw = req.cookies.get(COOKIE_NAME)?.value;

  let user = null;
  if (raw) {
    try {
      user = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    } catch {
      user = null;
    }
  }

  return NextResponse.json(
    {
      success: !!user,
      user,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

/* ============================================================
   🔹 POST — LOGIN WITH PI TOKEN (MAIN FLOW)
============================================================ */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { accessToken?: string };

    if (!body.accessToken) {
      return NextResponse.json(
        { success: false, error: "missing_access_token" },
        { status: 400 }
      );
    }

    /* 🔐 VERIFY TOKEN WITH PI NETWORK */
    const piRes = await fetch("https://api.minepi.com/v2/me", {
      headers: {
        Authorization: `Bearer ${body.accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!piRes.ok) {
      return NextResponse.json(
        { success: false, error: "invalid_access_token" },
        { status: 401 }
      );
    }

    const data = (await piRes.json()) as {
      uid?: string;
      username?: string;
      wallet_address?: string;
    };

    if (!data.uid || !data.username) {
      return NextResponse.json(
        { success: false, error: "invalid_pi_user" },
        { status: 401 }
      );
    }

    /* ======================================================
       ✅ AUTH USER (PI = IDENTITY PROVIDER)
    ====================================================== */
    const user = {
      uid: data.uid,
      username: data.username,
      wallet_address: data.wallet_address ?? null,
    };

    /* ======================================================
       ✅ DB SOURCE OF TRUTH — USERS (BẮT BUỘC)
       Pi UID = PRIMARY KEY
    ====================================================== */
    await query(
  `
  insert into users (pi_uid, username, role)
  values ($1, $2, 'seller')
  on conflict (pi_uid)
  do update set
    username = excluded.username
  `,
  [data.uid, data.username]
);

    /* ======================================================
       (OPTIONAL) BOOTSTRAP PROFILE — KHÔNG ẢNH HƯỞNG FLOW
    ====================================================== */
    try {
      await query(
        `
        INSERT INTO user_profile (uid, username, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (uid) DO NOTHING
        `,
        [user.uid, user.username]
      );
    } catch {
      // nếu bảng chưa tồn tại cũng không sao
    }

    /* ======================================================
       🍪 SET COOKIE (SESSION)
    ====================================================== */
    const cookieValue = Buffer.from(
      JSON.stringify(user),
      "utf8"
    ).toString("base64");

    const res = NextResponse.json({
      success: true,
      user,
    });

    res.headers.set("Set-Cookie", buildCookie(cookieValue));

    return res;
  } catch (err) {
    console.error("❌ PI VERIFY ERROR:", err);
    return NextResponse.json(
      { success: false, error: "server_error" },
      { status: 500 }
    );
  }
}

/* ============================================================
   🔹 DELETE — LOGOUT
============================================================ */
export function DELETE() {
  const res = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", buildCookie("deleted", 0));
  return res;
}

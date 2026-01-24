export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { cookies } from "next/headers";

const COOKIE_NAME = "pi_user";

/* =========================
   TYPES
========================= */
type Session = {
  uid: string;
};

type UserRole = "buyer" | "seller" | "admin";

/* =========================
   SESSION HELPER
========================= */
function getSession(): Session | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64").toString("utf8")
    ) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "uid" in parsed &&
      typeof (parsed as { uid: unknown }).uid === "string"
    ) {
      return { uid: (parsed as { uid: string }).uid };
    }
    return null;
  } catch {
    return null;
  }
}

/* =========================
   GET — LẤY ROLE USER HIỆN TẠI
========================= */
export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const key = `user_role:${session.uid}`;
  const role = (await kv.get<UserRole>(key)) ?? "buyer";

  return NextResponse.json({
    success: true,
    role,
  });
}

/* =========================
   POST — ADMIN GÁN ROLE
========================= */
export async function POST(req: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  // 🔐 CHỈ ADMIN
  const myRole = await kv.get<UserRole>(`user_role:${session.uid}`);
  if (myRole !== "admin") {
    return NextResponse.json(
      { success: false, error: "forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = (await req.json()) as unknown;

    if (
      typeof body !== "object" ||
      body === null ||
      !("uid" in body) ||
      !("role" in body)
    ) {
      return NextResponse.json(
        { success: false, error: "invalid_payload" },
        { status: 400 }
      );
    }

    const { uid, role } = body as { uid: string; role: UserRole };

    if (!["buyer", "seller", "admin"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "invalid_role" },
        { status: 400 }
      );
    }

    await kv.set(`user_role:${uid}`, role);

    return NextResponse.json({
      success: true,
      uid,
      role,
    });
  } catch (err: unknown) {
    console.error("❌ Lỗi gán role:", err);
    return NextResponse.json(
      { success: false, error: "server_error" },
      { status: 500 }
    );
  }
}

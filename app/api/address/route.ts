/* =========================================================
   app/api/address/route.ts
   - NETWORK–FIRST Pi Auth
   - Bearer ONLY (NO cookie)
   - Address storage via Vercel KV
   - Phase 1 Bootstrap safe
========================================================= */

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   TYPES
========================= */
type Address = {
  name: string;
  phone: string;
  address: string;
};

type PiUser = {
  pi_uid: string;
};

/* =========================
   AUTH — PI BEARER
========================= */
async function getUserFromBearer(): Promise<PiUser | null> {
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
  if (!data?.uid) return null;

  return { pi_uid: String(data.uid) };
}

/* =========================
   GET /api/address
========================= */
export async function GET() {
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const key = `address:${user.pi_uid}`;
  const address = await kv.get<Address>(key);

  return NextResponse.json({
    success: true,
    address: address ?? null,
  });
}

/* =========================
   POST /api/address
========================= */
export async function POST(req: Request) {
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as Partial<Address>;

    if (
      !body ||
      typeof body.name !== "string" ||
      typeof body.phone !== "string" ||
      typeof body.address !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const key = `address:${user.pi_uid}`;
    await kv.set(key, {
      name: body.name.trim(),
      phone: body.phone.trim(),
      address: body.address.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ ADDRESS SAVE ERROR:", err);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

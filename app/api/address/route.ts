import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { cookies } from "next/headers";

/**
 * 🟢 API: /api/address
 * - GET: lấy địa chỉ của USER HIỆN TẠI
 * - POST: lưu/cập nhật địa chỉ của USER HIỆN TẠI
 *
 * 🔐 Identity lấy từ cookie pi_user (đã verify Pi)
 */

const COOKIE_NAME = "pi_user";

type Session = {
  uid: string;
};

type Address = {
  name: string;
  phone: string;
  address: string;
};

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

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const key = `address:${session.uid}`;
  const data = await kv.get<Address>(key);

  return NextResponse.json({
    success: true,
    address: data ?? null,
  });
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as unknown;

    if (
      typeof body !== "object" ||
      body === null ||
      !("name" in body) ||
      !("phone" in body) ||
      !("address" in body)
    ) {
      return NextResponse.json(
        { success: false, error: "invalid_payload" },
        { status: 400 }
      );
    }

    const { name, phone, address } = body as Address;

    const key = `address:${session.uid}`;
    await kv.set(key, { name, phone, address });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("❌ Lỗi lưu địa chỉ:", err);
    return NextResponse.json(
      { success: false, error: "server_error" },
      { status: 500 }
    );
  }
}

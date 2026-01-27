import { NextResponse } from "next/server";

import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";

/**
 * API: /api/returns
 * - Customer gửi yêu cầu trả hàng
 * - NETWORK-FIRST (Bearer Pi token)
 * - AUTH-CENTRIC + RBAC
 * - NO any
 */

/* =========================
   TYPES
========================= */

type ReturnRequestBody = {
  orderId: string;
  reason: string;
  images?: string[];
};

/* =========================
   RUNTIME GUARD
========================= */

function isReturnRequestBody(
  value: unknown
): value is ReturnRequestBody {
  if (typeof value !== "object" || value === null) return false;

  const v = value as Record<string, unknown>;

  if (typeof v.orderId !== "string") return false;
  if (typeof v.reason !== "string") return false;

  if ("images" in v) {
    if (!Array.isArray(v.images)) return false;
    if (!v.images.every((i) => typeof i === "string"))
      return false;
  }

  return true;
}

/* =========================
   POST /api/returns
========================= */

export async function POST(req: Request) {
  // 🔐 Auth
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const role = await resolveRole(user);
  if (role !== "customer") {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  // 📦 Body
  const body: unknown = await req.json();

  if (!isReturnRequestBody(body)) {
    return NextResponse.json(
      { error: "INVALID_BODY" },
      { status: 400 }
    );
  }

  const { orderId, reason, images } = body;

  /**
   * 👉 Bản production:
   * - validate order belongs to user
   * - lưu vào DB / KV
   */
  console.log("📦 [RETURN REQUEST]", {
    buyerPiUid: user.pi_uid,
    orderId,
    reason,
    images: images ?? [],
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    message: "Yêu cầu trả hàng đã được ghi nhận.",
  });
}

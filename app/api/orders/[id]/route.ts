/* app/api/orders/[id]/route.ts */

import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { resolveRole } from "@/lib/auth/resolveRole";
import {
  getOrderById,
  updateOrderStatus,
  OrderRecord,
} from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   TYPES
========================= */
type PiUser = {
  uid: string;
};

type UpdateOrderBody = {
  status: string;
};

/* =========================
   PI AUTH
========================= */
async function getUserFromPi(): Promise<PiUser> {
  const auth = headers().get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    throw new Error("UNAUTHENTICATED");
  }

  const token = auth.slice("Bearer ".length).trim();

  const res = await fetch("https://api.minepi.com/v2/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("UNAUTHENTICATED");
  }

  const data = (await res.json()) as unknown;

  if (
    typeof data !== "object" ||
    data === null ||
    !("uid" in data) ||
    typeof (data as { uid: unknown }).uid !== "string"
  ) {
    throw new Error("UNAUTHENTICATED");
  }

  return { uid: (data as { uid: string }).uid };
}

/* =========================
   GET /api/orders/[id]
========================= */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromPi();
    const role = await resolveRole(user);

    const order: OrderRecord | null =
      await getOrderById(params.id);

    if (!order) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // CUSTOMER: chỉ xem đơn của mình
    if (
      role === "customer" &&
      order.buyer.pi_uid !== user.uid
    ) {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // SELLER: chỉ xem đơn có sản phẩm của mình
    if (
      role === "seller" &&
      !order.items.some(
        (item) => item.product.seller.pi_uid === user.uid
      )
    ) {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }
}

/* =========================
   PATCH /api/orders/[id]
========================= */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromPi();
    const role = await resolveRole(user);

    if (role !== "seller") {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as UpdateOrderBody;

    if (!body?.status || typeof body.status !== "string") {
      return NextResponse.json(
        { error: "INVALID_STATUS" },
        { status: 400 }
      );
    }

    const order: OrderRecord | null =
      await getOrderById(params.id);

    if (!order) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // SELLER chỉ được cập nhật đơn có sản phẩm của mình
    const isOwner = order.items.some(
      (item) => item.product.seller.pi_uid === user.uid
    );

    if (!isOwner) {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    await updateOrderStatus(params.id, body.status);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }
}

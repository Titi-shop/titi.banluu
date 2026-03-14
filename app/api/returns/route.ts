import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* =========================
   TYPES
========================= */

type ReturnPayload = {
  order_id?: unknown;
  order_item_id?: unknown;
  reason?: unknown;
  description?: unknown;
  images?: unknown;
};

type OrderRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
};

type OrderItemRow = {
  id: string;
  product_id: string;
  quantity: number;
  product_name: string;
  product_thumbnail: string | null;
  price: number;
};

/* =========================
   POST – CREATE RETURN
========================= */

export async function POST(req: Request) {
  try {
    /* 1️⃣ AUTH */

    const user = await getUserFromBearer();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* 2️⃣ PARSE BODY */

    const raw = (await req.json()) as ReturnPayload;

    const orderId =
      typeof raw.order_id === "string" ? raw.order_id : null;

    const orderItemId =
      typeof raw.order_item_id === "string"
        ? raw.order_item_id
        : null;

    const reason =
      typeof raw.reason === "string"
        ? raw.reason.trim()
        : null;

    const description =
      typeof raw.description === "string"
        ? raw.description.trim()
        : null;

    const images =
      Array.isArray(raw.images) &&
      raw.images.every((i) => typeof i === "string")
        ? raw.images
        : [];

    if (!orderId || !orderItemId || !reason) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    /* 3️⃣ GET DB USER */

    const { data: dbUser } = await supabaseAdmin
      .from("users")
      .select("pi_uid")
      .eq("pi_uid", user.pi_uid)
      .single();

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    /* 4️⃣ CHECK ORDER */

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,buyer_id,seller_id,status")
      .eq("id", orderId)
      .eq("buyer_id", dbUser.pi_uid)
      .single<OrderRow>();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (!["completed", "delivered"].includes(order.status)) {
      return NextResponse.json(
        { error: "Order not returnable" },
        { status: 400 }
      );
    }

    /* 5️⃣ GET ORDER ITEM */

    const { data: item } = await supabaseAdmin
      .from("order_items")
      .select(
        "id,product_id,quantity,product_name,product_thumbnail,price"
      )
      .eq("id", orderItemId)
      .eq("order_id", orderId)
      .single<OrderItemRow>();

    if (!item) {
      return NextResponse.json(
        { error: "Order item not found" },
        { status: 404 }
      );
    }

    /* 6️⃣ CHECK EXISTING RETURN */

    const { data: existing } = await supabaseAdmin
      .from("returns")
      .select("id")
      .eq("order_item_id", orderItemId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Return already requested" },
        { status: 400 }
      );
    }

    /* 7️⃣ CALCULATE REFUND */

    const refundAmount = item.price * item.quantity;

    /* 8️⃣ INSERT RETURN */

    const { error: insertError } = await supabaseAdmin
      .from("returns")
      .insert({
        order_id: orderId,
        order_item_id: orderItemId,
        product_id: item.product_id,

        seller_id: order.seller_id,
        buyer_id: order.buyer_id,

        product_name: item.product_name,
        product_thumbnail: item.product_thumbnail,

        quantity: item.quantity,

        reason,
        description,
        images,

        refund_amount: refundAmount,

        status: "pending",
      });

    if (insertError) {
      console.error(insertError);

      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error("RETURN API ERROR:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

/* =========================
   GET – LIST BUYER RETURNS
========================= */

export async function GET() {
  try {
    const user = await getUserFromBearer();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("returns")
      .select(`
        id,
        order_id,
        product_name,
        product_thumbnail,
        quantity,
        refund_amount,
        status,
        created_at
      `)
      .eq("buyer_id", user.pi_uid)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

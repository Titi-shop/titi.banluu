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
  unit_price: number;
};

/* =========================
   POST – CREATE RETURN
========================= */

export async function POST(req: Request) {
  try {

    console.log("AUTH HEADER:", req.headers.get("authorization"));
    /* 1️⃣ AUTH */

    const user = await getUserFromBearer(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* 2️⃣ PARSE BODY (JSON OR FORM DATA) */

    let raw: ReturnPayload;

    const contentType = req.headers.get("content-type") ?? "";

    let imageStrings: string[] = [];

if (contentType.includes("multipart/form-data")) {
  const form = await req.formData();

  raw = {
    order_id: form.get("order_id"),
    order_item_id: form.get("order_item_id"),
    reason: form.get("reason"),
    description: form.get("description"),
    images: form.getAll("images"),
  };

  const files = form.getAll("images");

  imageStrings = [];

  for (const file of files) {

    if (!(file instanceof File)) continue;

    const buffer = Buffer.from(await file.arrayBuffer());

    const base64 = buffer.toString("base64");

    const mime = file.type || "image/jpeg";

    imageStrings.push(`data:${mime};base64,${base64}`);
  }

} else {
  raw = (await req.json()) as ReturnPayload;
}

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

    const images = imageStrings;
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

    if (images.length > 3) if (images.some(img => img.length > 2_000_000)) {
  return NextResponse.json(
    { error: "Image too large" },
    { status: 400 }
  );
}{
      return NextResponse.json(
        { error: "Maximum 3 images allowed" },
        { status: 400 }
      );
    }

    /* 3️⃣ VERIFY USER EXISTS */

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

    /* 4️⃣ GET ORDER */

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
        "id,product_id,quantity,product_name,product_thumbnail,unit_price"
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

    const refundAmount = item.unit_price * item.quantity;

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
   GET – BUYER RETURNS
========================= */

export async function GET(req: Request) {
  try {
    const user = await getUserFromBearer(req);

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

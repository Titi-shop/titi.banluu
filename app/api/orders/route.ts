import { NextResponse } from "next/server";
import { verifyPiToken } from "@/lib/piAuth";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");

    if (!auth) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const token = auth.replace("Bearer ", "");

    const piUser = await verifyPiToken(token);

    const buyer_id = piUser.uid;

    const body = await req.json();

    const {
      paymentId,
      txid,
      items,
      total,
      shipping
    } = body;

    if (!paymentId || !txid || !items?.length) {
      return NextResponse.json(
        { error: "INVALID_ORDER" },
        { status: 400 }
      );
    }

    const order_number =
      "ORD-" + Date.now().toString().slice(-8);

    await query(
      `
      insert into orders (
        order_number,
        buyer_id,
        pi_payment_id,
        pi_txid,
        subtotal,
        total,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_provider,
        shipping_country,
        shipping_postal_code
      )
      values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
      )
    `,
      [
        order_number,
        buyer_id,
        paymentId,
        txid,
        total,
        total,
        shipping.name,
        shipping.phone,
        shipping.address_line,
        "self",
        shipping.country,
        shipping.postal_code,
      ]
    );

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json(
      { error: "ORDER_FAILED" },
      { status: 500 }
    );
  }
}

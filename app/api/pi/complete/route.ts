import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const PI_API = process.env.PI_API_URL!;
const PI_KEY = process.env.PI_API_KEY!;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const paymentId = body.paymentId;
    const txid = body.txid;

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_DATA" },
        { status: 400 }
      );
    }

    /* =========================
       COMPLETE PI PAYMENT
    ========================= */

    const piRes = await fetch(
      `${PI_API}/payments/${paymentId}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${PI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txid }),
        cache: "no-store",
      }
    );

    const text = await piRes.text();

    if (!piRes.ok) {
      console.error("PI COMPLETE FAIL:", text);
    }

    /* =========================
       CREATE ORDER (SAFE)
    ========================= */

    if (piRes.ok) {
      try {
        const shipping = body.shipping ?? {};
        const user = body.user ?? {};

        const subtotal = Math.round(body.total ?? 0);
        const total = Math.round(body.total ?? 0);

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
            shipping_country,
            shipping_postal_code
          )
          values (
            gen_random_uuid()::text,
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
          )
          on conflict (pi_payment_id) do nothing
          `,
          [
            user.pi_uid ?? "",
            paymentId,
            txid,
            subtotal,
            total,
            shipping.name ?? "",
            shipping.phone ?? "",
            shipping.address_line ?? "",
            shipping.country ?? "",
            shipping.postal_code ?? "",
          ]
        );
      } catch (e) {
        console.error("ORDER CREATE FAIL:", e);
      }
    }

    /* ========================= */

    return new NextResponse(text || "{}", {
      status: piRes.status,
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (err) {
    console.error("PI COMPLETE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

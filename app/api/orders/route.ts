import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const PI_API = process.env.PI_API_URL!;
const PI_KEY = process.env.PI_API_KEY!;

type PiUser = {
  uid: string;
  username: string;
};

async function getPiUser(accessToken: string): Promise<PiUser | null> {
  const res = await fetch(`${PI_API}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-API-Key": PI_KEY,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as PiUser;

  return data;
}

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization");

    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const accessToken = auth.replace("Bearer ", "");

    /* =========================
       VERIFY PI USER
    ========================= */

    const piUser = await getPiUser(accessToken);

    if (!piUser) {
      return NextResponse.json(
        { error: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    /* =========================
       LOAD ORDERS
    ========================= */

    const { rows } = await query(
      `
      select
        id,
        order_number,
        subtotal,
        shipping_fee,
        discount,
        tax,
        total,
        currency,
        status,
        payment_status,
        created_at
      from orders
      where buyer_id = $1
      order by created_at desc
      `,
      [piUser.uid]
    );

    return NextResponse.json(
      {
        orders: rows,
      },
      {
        status: 200,
      }
    );
  } catch (err) {
    console.error("ORDERS API ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

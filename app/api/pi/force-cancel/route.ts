import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

export async function POST(req: Request) {
  try {
    if (!process.env.PI_API_KEY) {
      return NextResponse.json(
        { error: "SERVER_MISCONFIGURED" },
        { status: 500 }
      );
    }

    const user = await getUserFromBearer();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { paymentId } = await req.json().catch(() => ({}));

    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    const cancelRes = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
      }
    );

    if (!cancelRes.ok) {
      const err = await cancelRes.text();
      return NextResponse.json(
        { error: err },
        { status: cancelRes.status }
      );
    }

    return NextResponse.json({ cancelled: true });

  } catch (err) {
    console.error("FORCE CANCEL ERROR:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyPiToken } from "@/lib/piAuth";

const PI_API_URL = process.env.PI_API_URL!;
const PI_API_KEY = process.env.PI_API_KEY!;

export async function POST(req: NextRequest) {
  try {

    /* =========================
       1. VERIFY USER TOKEN
    ========================= */

    const auth = req.headers.get("authorization");

    if (!auth) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const token = auth.replace("Bearer ", "").trim();
    const user = await verifyPiToken(token);

    if (!user?.pi_uid) {
      return NextResponse.json(
        { error: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    /* =========================
       2. READ BODY
    ========================= */

    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_ID" },
        { status: 400 }
      );
    }

    /* =========================
       3. VERIFY PAYMENT FROM PI
    ========================= */

    const paymentRes = await fetch(
      `${PI_API_URL}/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Key ${PI_API_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!paymentRes.ok) {
      return NextResponse.json(
        { error: "PAYMENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    const payment = await paymentRes.json();

    /* =========================
       4. CHECK PAYMENT OWNER
    ========================= */

    if (payment.user_uid !== user.pi_uid) {
      return NextResponse.json(
        { error: "USER_MISMATCH" },
        { status: 400 }
      );
    }

    /* =========================
       5. CHECK PAYMENT STATUS
    ========================= */

    if (payment.status !== "CREATED") {
      return NextResponse.json(
        { error: "INVALID_PAYMENT_STATUS" },
        { status: 400 }
      );
    }

    /* =========================
       6. APPROVE PAYMENT
    ========================= */

    const approveRes = await fetch(
      `${PI_API_URL}/payments/${paymentId}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${PI_API_KEY}`,
        },
      }
    );

    if (!approveRes.ok) {
      const text = await approveRes.text();

      console.error("PI APPROVE FAIL:", text);

      return NextResponse.json(
        { error: "PI_APPROVE_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId,
    });

  } catch (err) {

    console.error("PI APPROVE ERROR:", err);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface CompleteBody {
  paymentId: string;
  txid: string;
}

export async function POST(req: Request) {
  try {
    /* =========================
       AUTH CHECK (Bearer Token)
    ========================= */
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "").trim();

    if (!accessToken) {
      return NextResponse.json(
        { error: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    /* =========================
       BODY VALIDATION
    ========================= */
    const body: CompleteBody = await req.json();

    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_DATA" },
        { status: 400 }
      );
    }

    /* =========================
       PI API KEY CHECK
    ========================= */
    const apiKey = process.env.PI_API_KEY;

    if (!apiKey) {
      console.error("PI_API_KEY missing");
      return NextResponse.json(
        { error: "SERVER_CONFIG_ERROR" },
        { status: 500 }
      );
    }

    /* =========================
       COMPLETE PAYMENT ON PI
    ========================= */
    const piRes = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txid }),
      }
    );

    const data = await piRes.json();

    if (!piRes.ok) {
      console.error("PI COMPLETE FAILED:", data);
      return NextResponse.json(
        { error: "PI_COMPLETE_FAILED", details: data },
        { status: piRes.status }
      );
    }

    /* =========================
       SUCCESS
    ========================= */
    return NextResponse.json(data);

  } catch (error: unknown) {
    console.error("PI COMPLETE SERVER ERROR:", error);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

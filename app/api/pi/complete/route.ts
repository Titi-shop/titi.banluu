import { NextRequest, NextResponse } from "next/server";
import { verifyPiToken } from "@/lib/piAuth";

type PiCompleteBody = {
  paymentId: string;
  txid: string;
};

export async function POST(req: NextRequest) {
  try {

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

    const body: PiCompleteBody = await req.json();

    if (!body.paymentId || !body.txid) {
      return NextResponse.json(
        { error: "INVALID_PAYMENT" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (err) {

    return NextResponse.json(
      { error: "COMPLETE_FAILED" },
      { status: 500 }
    );

  }
}

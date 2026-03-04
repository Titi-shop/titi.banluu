import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

export async function POST() {
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

    // Lấy payments của user
    const listRes = await fetch(
      `https://api.minepi.com/v2/payments?user_uid=${user.pi_uid}`,
      {
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
      }
    );

    if (!listRes.ok) {
      return NextResponse.json(
        { error: "FETCH_FAILED" },
        { status: 400 }
      );
    }

    const data = await listRes.json();

    const pending = data?.data?.find(
      (p: { status: string }) =>
        p.status === "created" || p.status === "approved"
    );

    if (!pending) {
      return NextResponse.json({ ok: true });
    }

    await fetch(
      `https://api.minepi.com/v2/payments/${pending.identifier}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
      }
    );

    return NextResponse.json({ cancelled: true });

  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

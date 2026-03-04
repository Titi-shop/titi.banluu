import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    /* =========================
       CHECK SERVER CONFIG
    ========================= */
    if (!process.env.PI_API_KEY) {
      return NextResponse.json(
        { error: "SERVER_MISCONFIGURED" },
        { status: 500 }
      );
    }

    /* =========================
       AUTH USER
    ========================= */
    const user = await getUserFromBearer();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const paymentId = body?.paymentId;

    /* =========================================================
       CASE 1: Nếu truyền paymentId → hủy trực tiếp
    ========================================================= */
    if (paymentId) {
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
        const errText = await cancelRes.text();
        console.error("CANCEL ERROR:", errText);

        return NextResponse.json(
          { error: errText },
          { status: cancelRes.status }
        );
      }

      return NextResponse.json({ cancelled: 1 });
    }

    /* =========================================================
       CASE 2: Không truyền paymentId
       → Lấy tất cả payment của app đang pending
       → Lọc theo user
       → Hủy hết
    ========================================================= */

    const listRes = await fetch(
      `https://api.minepi.com/v2/payments?status=created,approved,submitted`,
      {
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
      }
    );

    if (!listRes.ok) {
      const errText = await listRes.text();
      console.error("LIST PAYMENT ERROR:", errText);

      return NextResponse.json(
        { error: "FETCH_FAILED" },
        { status: 400 }
      );
    }

    const data = await listRes.json();

    const pendings =
      data?.data?.filter(
        (p: any) =>
          p.user_uid === user.pi_uid &&
          (p.status === "created" ||
            p.status === "approved" ||
            p.status === "submitted")
      ) || [];

    if (pendings.length === 0) {
      return NextResponse.json({ ok: true });
    }

    let cancelledCount = 0;

    for (const p of pendings) {
      try {
        await fetch(
          `https://api.minepi.com/v2/payments/${p.identifier}/cancel`,
          {
            method: "POST",
            headers: {
              Authorization: `Key ${process.env.PI_API_KEY}`,
            },
          }
        );
        cancelledCount++;
      } catch (err) {
        console.error("CANCEL LOOP ERROR:", err);
      }
    }

    return NextResponse.json({
      cancelled: cancelledCount,
    });

  } catch (err) {
    console.error("FORCE CANCEL ERROR:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

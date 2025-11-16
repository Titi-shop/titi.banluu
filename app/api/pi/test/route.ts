// app/api/pi/test/route.ts
import { NextResponse } from "next/server";

/**
 * ✅ API test đơn giản cho Pi Network SDK
 * Cho phép bạn gọi /api/pi/test để kiểm tra server hoạt động,
 * và nhận POST từ trang /pi/test khi approve hoặc complete thanh toán.
 */

export async function GET() {
  return NextResponse.json({
    message: "✅ Pi Test API is active",
    info: "Use POST /api/pi/test to simulate approve or complete payment",
    example: {
      approve: { action: "approve", paymentId: "123" },
      complete: { action: "complete", paymentId: "123", txid: "abc123" },
    },
  });
}

// ✅ Xử lý yêu cầu POST gửi từ client (khi thanh toán test)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, paymentId, txid } = body;

    if (!action || !paymentId) {
      return NextResponse.json(
        { ok: false, error: "Thiếu tham số action hoặc paymentId" },
        { status: 400 }
      );
    }

    // ✅ Lấy thông tin môi trường
    const API_KEY = process.env.PI_API_KEY;
    const API_URL =
      process.env.PI_API_URL || "https://api.minepi.com/v2/sandbox/payments";

    if (!API_KEY) {
      console.error("❌ Missing PI_API_KEY in environment variables");
      return NextResponse.json(
        { ok: false, error: "Thiếu biến môi trường PI_API_KEY" },
        { status: 500 }
      );
    }

    console.log(`🔔 [TEST API] ${action.toUpperCase()} paymentId=${paymentId}`);

    // ✅ Gửi request tới Pi API thật (sandbox hoặc main tùy env)
    let endpoint = "";
    if (action === "approve") endpoint = `${API_URL}/${paymentId}/approve`;
    else if (action === "complete") endpoint = `${API_URL}/${paymentId}/complete`;
    else
      return NextResponse.json(
        { ok: false, error: "Action không hợp lệ" },
        { status: 400 }
      );

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: action === "complete" ? JSON.stringify({ txid }) : undefined,
    });

    const text = await res.text();

    console.log(`✅ [PI ${action.toUpperCase()} RESULT]:`, res.status, text);

    if (res.status === 401)
      console.error("❌ Sai API key hoặc domain chưa được khai báo trong Pi Developer Portal!");

    return new NextResponse(text, {
      status: res.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: any) {
    console.error("💥 [Pi TEST API ERROR]:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "unknown" },
      { status: 500 }
    );
  }
}

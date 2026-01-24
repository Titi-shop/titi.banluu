import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Gọi API từ OKX (PI/USDT)
    const res = await fetch("https://www.okx.com/api/v5/market/ticker?instId=PI-USDT", {
      cache: "no-store", // Không cache để luôn lấy dữ liệu mới
    });

    if (!res.ok) throw new Error("Không thể kết nối OKX");

    const data = await res.json();
    const priceStr = data?.data?.[0]?.last;
    const price = priceStr ? parseFloat(priceStr) : null;

    return NextResponse.json({
      symbol: "PI/USDT",
      price_usd: price,
      source: "OKX",
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Lỗi lấy giá Pi từ OKX:", err);
    return NextResponse.json({ error: "Không thể lấy giá Pi từ OKX" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

interface OkxTickerData {
  last: string;
  sodUtc8?: string; // giá mở cửa hôm nay
}

interface OkxResponse {
  data?: OkxTickerData[];
}

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      "https://www.okx.com/api/v5/market/ticker?instId=PI-USDT",
      {
        cache: "no-store",
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `OKX response error (${res.status})` },
        { status: 500 }
      );
    }

    const json: OkxResponse = (await res.json()) as OkxResponse;

    if (!json.data || json.data.length === 0) {
      return NextResponse.json(
        { error: "Invalid response structure from OKX" },
        { status: 500 }
      );
    }

    const ticker = json.data[0];
    const price = Number(ticker.last);
    const sod = ticker.sodUtc8 ? Number(ticker.sodUtc8) : null;

    if (Number.isNaN(price)) {
      return NextResponse.json(
        { error: "Invalid price received from OKX" },
        { status: 500 }
      );
    }

    // Tính % tăng/giảm dựa trên giá mở cửa hôm nay
    let change: number | null = null;
    if (sod !== null && sod !== 0) {
      change = ((price - sod) / sod) * 100;
    }

    return NextResponse.json({
      symbol: "PI/USDT",
      price_usd: price,
      change_24h: change, // % tăng/giảm tự tính
      source: "OKX",
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to fetch PI price: ${message}` },
      { status: 500 }
    );
  }
}

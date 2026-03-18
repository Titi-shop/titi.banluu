import { NextResponse } from "next/server";

interface OkxTickerData {
  last: string;
  changePct?: string; // % thay đổi 24h
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
    const change = ticker.changePct ? Number(ticker.changePct) : null;

    if (Number.isNaN(price)) {
      return NextResponse.json(
        { error: "Invalid price received from OKX" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      symbol: "PI/USDT",
      price_usd: price,
      change_24h: change, // % thay đổi 24h chuẩn
      source: "OKX",
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to fetch PI price: ${message}` },
      { status: 500 }
    );
  }
}

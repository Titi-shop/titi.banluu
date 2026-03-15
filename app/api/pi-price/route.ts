import { NextResponse } from "next/server";

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

    const json: unknown = await res.json();

    if (
      typeof json !== "object" ||
      json === null ||
      !("data" in json)
    ) {
      return NextResponse.json(
        { error: "Invalid response structure from OKX" },
        { status: 500 }
      );
    }

    const data = (json as {
      data?: {
        last?: string;
        sodUtc8?: string;
      }[];
    }).data;

    const priceStr = data?.[0]?.last;
    const changeStr = data?.[0]?.sodUtc8;

    const price = priceStr ? Number(priceStr) : null;
    const change = changeStr ? Number(changeStr) : null;

    if (!price || Number.isNaN(price)) {
      return NextResponse.json(
        { error: "Invalid price received from OKX" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      symbol: "PI/USDT",
      price_usd: price,
      change_24h: change,
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

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("product_id");

    if (!productId) {
      return NextResponse.json(
        { error: "MISSING_PRODUCT_ID" },
        { status: 400 }
      );
    }

    const { rows } = await query(
      `
      select coalesce(sum(quantity),0) as sold
      from order_items
      where product_id = $1
      and status not in ('cancelled')
      `,
      [productId]
    );

    return NextResponse.json({
      sold: Number(rows[0]?.sold || 0)
    });

  } catch (error) {

    console.error("PRODUCT SOLD ERROR:", error);

    return NextResponse.json(
      { error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/* app/api/products/seller/me/route.ts */

import { NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/guard";
import { getSellerProducts } from "@/lib/db/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  const sellerPiUid = auth.user.uid;

  const products = await getSellerProducts(sellerPiUid);

  return NextResponse.json(products);
}

import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import { getSellerProducts } from "@/lib/db/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SellerProduct = {
  id: string;
  name: string;
  price: number;
  thumbnail: string | null;
  images: string[] | null;
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function GET() {
  try {
    const user = await getUserFromBearer();

    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    const role = await resolveRole(user);

    if (role !== "seller" && role !== "admin") {
      return NextResponse.json([], { status: 200 });
    }

    const products = (await getSellerProducts(user.pi_uid)) as SellerProduct[];

    return NextResponse.json(products);
  } catch (err) {
    console.warn("SELLER PRODUCTS WARN:", err);
    return NextResponse.json([], { status: 200 });
  }
}

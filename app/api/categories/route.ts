import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET() {
  const categories = (await kv.get("categories")) || [];
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const { name, icon } = await req.json();

  if (!name || !icon) {
    return NextResponse.json(
      { error: "Thiếu name hoặc icon" },
      { status: 400 }
    );
  }

  const categories = (await kv.get("categories")) || [];

  const item = {
    id: Date.now(),
    name,
    icon
  };

  categories.push(item);

  await kv.set("categories", categories);

  return NextResponse.json(item);
}

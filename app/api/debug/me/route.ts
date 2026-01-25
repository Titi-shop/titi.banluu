import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = headers().get("authorization");
  if (!auth) {
    return NextResponse.json({ error: "NO_AUTH" }, { status: 401 });
  }

  const res = await fetch("https://api.minepi.com/v2/me", {
    headers: {
      Authorization: auth,
    },
  });

  const data = await res.json();
  return NextResponse.json(data);
}

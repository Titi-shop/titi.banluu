import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return NextResponse.json({
        ok: false,
        error: "Missing Supabase env variables"
      }, { status: 500 });
    }

    const res = await fetch(
      `${url}/rest/v1/users?select=id&limit=1`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        cache: "no-store"
      }
    );

    const data = await res.json();

    return NextResponse.json({
      ok: true,
      data
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message
    }, { status: 500 });
  }
}

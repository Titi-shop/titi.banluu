import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   TYPES
========================= */
interface Address {
  id: string;
  pi_uid: string;
  name: string;
  phone: string;
  address: string;
  country?: string;
  is_default: boolean;
  created_at: string;
}

/* =========================
   PI AUTH
========================= */
async function getPiUid(): Promise<string | null> {
  const auth = headers().get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const res = await fetch("https://api.minepi.com/v2/me", {
    headers: { Authorization: auth },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data?.uid ? String(data.uid) : null;
}

/* =========================
   GET
========================= */
export async function GET() {
  const user = await getUserFromBearer();
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("addresses")
    .select("*")
    .eq("pi_uid", user.pi_uid)
    .order("created_at", { ascending: false });

  return NextResponse.json({ success: true, items: data ?? [] });
}

/* =========================
   POST
========================= */
export async function POST(req: Request) {
  const pi_uid = await getPiUid();
  if (!pi_uid)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = (await req.json()) as Partial<Address>;
  if (!body.name || !body.phone || !body.address)
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });

  // clear default
  await supabaseAdmin
    .from("addresses")
    .update({ is_default: false })
    .eq("pi_uid", pi_uid);

  const { data, error } = await supabaseAdmin
    .from("addresses")
    .insert({
      pi_uid,
      name: body.name.trim(),
      phone: body.phone.trim(),
      address: body.address.trim(),
      country: body.country,
      is_default: true,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, address: data });
}

/* =========================
   PUT: SET DEFAULT
========================= */
export async function PUT(req: Request) {
  const pi_uid = await getPiUid();
  if (!pi_uid)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = (await req.json()) as { id?: string };
  if (!id)
    return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });

  await supabaseAdmin
    .from("addresses")
    .update({ is_default: false })
    .eq("pi_uid", pi_uid);

  await supabaseAdmin
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("pi_uid", pi_uid);

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const API_KEY = process.env.bkw1u0q3zody4kiynkwbd00emdt1st1z9lpnfrvi637nxnvavsggimacdnfampbb;
    const res = await fetch("https://api.minepi.com/v2/payments/test", {
      headers: { Authorization: `Key ${API_KEY}` },
    });
    const data = await res.text();
    return new NextResponse(`✅ API OK: ${data}`, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

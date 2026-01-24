import { NextRequest, NextResponse } from "next/server";

const PI_ONLY =
  process.env.PI_BROWSER_ONLY === "true" ||
  process.env.NEXT_PUBLIC_PI_BROWSER_ONLY === "true";

// Heuristic UA check (Pi Browser thường có 'PiBrowser' trong user-agent)
function isPiBrowser(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  return /PiBrowser/i.test(ua);
}

export function middleware(req: NextRequest) {
  if (!PI_ONLY) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Allow static + Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Allow public entry points & auth endpoints
  const allow = [
    "/",
    "/pilogin",
    "/api/pi/verify",
    "/api/pi-price",
  ];
  if (allow.includes(pathname)) return NextResponse.next();

  // Chỉ chặn request từ browser (pages), không chặn server-to-server
  const secFetchDest = req.headers.get("sec-fetch-dest") || "";
  const isDoc = secFetchDest === "document" || secFetchDest === "empty";

  if (isDoc && !isPiBrowser(req)) {
    const url = req.nextUrl.clone();
    url.pathname = "/pilogin";
    url.searchParams.set("reason", "pi_browser_required");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/).*)"],
};

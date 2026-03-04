import { headers } from "next/headers";
import type { AuthUser } from "./types";

/* =========================================================
   PI AUTH — CLEAN VERSION (NO APP ID NEEDED)
========================================================= */
export async function getUserFromBearer(): Promise<AuthUser | null> {
  try {
    const authHeader = headers().get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const accessToken = authHeader.slice(7).trim();
    if (!accessToken) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch("https://api.minepi.com/v2/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      return null;
    }

    const data: any = await res.json();

    if (!data || !data.uid) {
      return null;
    }

    return {
      pi_uid: String(data.uid),
      username: data.username || "",
      wallet_address: data.wallet_address || null,
    };
  } catch (err) {
    if ((err as any)?.name === "AbortError") {
      console.warn("⚠️ Pi auth timeout");
      return null;
    }

    console.error("❌ getUserFromBearer error:", err);
    return null;
  }
}

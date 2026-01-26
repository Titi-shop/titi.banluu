/* =========================================================
   lib/auth/getUserFromBearer.ts
   - NETWORK–FIRST Pi Auth
   - Bearer token only
   - Shared auth helper (Phase 1 Bootstrap)
========================================================= */

import { headers } from "next/headers";

export type PiSessionUser = {
  pi_uid: string;
  username: string;
  wallet_address: string | null;
};

/* =========================================================
   VERIFY PI TOKEN FROM AUTHORIZATION HEADER
========================================================= */
export async function getUserFromBearer(): Promise<PiSessionUser | null> {
  try {
    const authHeader = headers().get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.slice(7).trim();
    if (!token) return null;

    const res = await fetch("https://api.minepi.com/v2/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();

    if (!data?.uid) {
      return null;
    }

    return {
      pi_uid: String(data.uid),
      username: String(data.username ?? ""),
      wallet_address: data.wallet_address ?? null,
    };
  } catch (err) {
    console.error("❌ getUserFromBearer error:", err);
    return null;
  }
}

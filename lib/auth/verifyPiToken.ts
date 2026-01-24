import { headers } from "next/headers";

/**
 * Verify Pi accessToken by calling Pi Network /v2/me
 * - Pi Network = Identity Provider (NOT DB)
 * - Returns minimal identity payload
 */
export type PiVerifiedUser = {
  pi_uid: string;
  username: string;
  wallet_address?: string | null;
};

export async function verifyPiTokenFromRequest(): Promise<PiVerifiedUser | null> {
  const auth = headers().get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;

  const token = auth.slice(7).trim();
  if (!token) return null;

  const res = await fetch("https://api.minepi.com/v2/me", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = (await res.json()) as any;
  if (!data?.uid || !data?.username) return null;

  return {
    pi_uid: String(data.uid),
    username: String(data.username),
    wallet_address: data.wallet_address ?? null,
  };
}

import { cookies } from "next/headers";

export type PiAuthUser = {
  uid: string;
  username: string;
  wallet_address?: string | null;
  roles?: string[];
};

export function getAuthUser(): PiAuthUser | null {
  const raw = cookies().get("pi_user")?.value;
  if (!raw) return null;

  try {
    // 🔥 QUAN TRỌNG: decode base64
    const json = Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(json);
  } catch (err) {
    console.error("❌ Invalid pi_user cookie", err);
    return null;
  }
}

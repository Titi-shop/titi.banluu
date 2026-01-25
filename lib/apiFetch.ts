// lib/apiFetch.ts
import { Pi } from "@pi-network/pi-sdk";

export async function apiFetch(
  url: string,
  options: RequestInit = {}
) {
  const auth = await Pi.authenticate(
    ["username"],
    { onIncompletePaymentFound: () => {} }
  );

  const token = auth.accessToken;
  if (!token) {
    throw new Error("NO_PI_TOKEN");
  }

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}

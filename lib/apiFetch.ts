// lib/apiFetch.ts
"use client";

declare global {
  interface Window {
    Pi?: any;
  }
}

export async function apiFetch(
  url: string,
  options: RequestInit = {}
) {
  if (typeof window === "undefined" || !window.Pi) {
    throw new Error("PI_SDK_NOT_AVAILABLE");
  }

  // ⚠️ Authenticate chỉ chạy trong Pi Browser
  const auth = await window.Pi.authenticate(
    ["username"],
    { onIncompletePaymentFound: () => {} }
  );

  const token = auth?.accessToken;
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

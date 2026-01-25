// lib/apiFetch.ts
"use client";

export async function apiFetch(
  url: string,
  options: RequestInit = {}
) {
  // Lấy token từ AuthContext storage (AUTH-CENTRIC)
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("pi_access_token")
      : null;

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

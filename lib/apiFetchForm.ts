// lib/apiFetchForm.ts
"use client";

export async function apiFetchForm(
  url: string,
  options: RequestInit = {}
) {
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
      // ❗ KHÔNG set Content-Type
      // Browser sẽ tự set multipart/form-data + boundary
    },
    cache: "no-store",
  });
}

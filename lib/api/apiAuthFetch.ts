export async function getPiAccessToken(): Promise<string> {
  if (typeof window === "undefined" || !window.Pi) {
    throw new Error("PI_NOT_AVAILABLE");
  }

  const scopes = ["username", "payments"];
  const auth = await window.Pi.authenticate(scopes, () => {});

  if (!auth?.accessToken) {
    throw new Error("PI_AUTH_FAILED");
  }

  return auth.accessToken;
}

export async function apiAuthFetch(
  url: string,
  options: RequestInit = {}
) {
  const token = await getPiAccessToken();

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

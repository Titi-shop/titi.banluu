const TOKEN_KEY = "pi_access_token";

export function getPiAccessToken(): string {
  if (typeof window === "undefined") {
    throw new Error("NO_WINDOW");
  }

  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error("NO_PI_TOKEN");
  }

  return token;
}

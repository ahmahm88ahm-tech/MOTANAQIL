import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "btc_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Setup the interceptor for generated API calls
export function initAuth(): void {
  setAuthTokenGetter(getToken);
}

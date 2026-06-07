import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "../lib/authStorage";
import { API_BASE } from "./client";

let unauthorizedHandler: (() => void) | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;

    const data = (await res.json()) as { access: string; refresh?: string };
    setTokens(data.access, data.refresh ?? refresh);
    return true;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const access = getAccessToken();
  if (access) headers.set("Authorization", `Bearer ${access}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(input, { ...init, headers });

  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryHeaders = new Headers(init.headers);
      const newAccess = getAccessToken();
      if (newAccess) retryHeaders.set("Authorization", `Bearer ${newAccess}`);
      if (init.body && !retryHeaders.has("Content-Type")) {
        retryHeaders.set("Content-Type", "application/json");
      }
      res = await fetch(input, { ...init, headers: retryHeaders });
    }
  }

  if (res.status === 401) {
    clearTokens();
    unauthorizedHandler?.();
  }

  return res;
}

import { apiFetch } from "./apiFetch";
import { setTokens } from "../lib/authStorage";
import { API_BASE } from "./client";

export interface AuthUser {
  username: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    let message = "Invalid username or password.";
    try {
      const body = (await res.json()) as Record<string, unknown>;
      if (typeof body.detail === "string") message = body.detail;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }

  const data = (await res.json()) as LoginResponse;
  setTokens(data.access, data.refresh);
  return data;
}

export async function fetchMe(signal?: AbortSignal): Promise<AuthUser> {
  const res = await apiFetch(`${API_BASE}/auth/me/`, { signal });
  if (!res.ok) throw new Error(`Failed to fetch user (${res.status})`);
  return res.json() as Promise<AuthUser>;
}

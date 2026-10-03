import { API_BASE } from "./client";
import { apiFetch } from "./apiFetch";
import type { Client, SheetNamingPattern } from "../types/sheet";

type ClientInput = { name?: string; remaining_hours?: number; sheet_naming_pattern?: SheetNamingPattern };

export async function fetchClients(signal?: AbortSignal): Promise<Client[]> {
  const res = await apiFetch(`${API_BASE}/clients/`, { signal });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Failed to fetch clients (${res.status})`);
  return res.json() as Promise<Client[]>;
}

export async function createClient(data: ClientInput): Promise<Client> {
  const res = await apiFetch(`${API_BASE}/clients/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let message = `Failed to create client (${res.status})`;
    try {
      const body = (await res.json()) as Record<string, unknown>;
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (body.name && Array.isArray(body.name) && body.name.length) {
        message = String(body.name[0]);
      } else if (typeof body.name === "string") {
        message = body.name;
      }
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return res.json() as Promise<Client>;
}

export async function updateClient(id: number, data: ClientInput): Promise<Client> {
  const res = await apiFetch(`${API_BASE}/clients/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let message = `Failed to update client (${res.status})`;
    try {
      const body = (await res.json()) as Record<string, unknown>;
      if (typeof body.detail === "string") message = body.detail;
      else if (body.name && Array.isArray(body.name) && body.name.length) {
        message = String(body.name[0]);
      }
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return res.json() as Promise<Client>;
}

export async function deleteClient(id: number): Promise<void> {
  const res = await apiFetch(`${API_BASE}/clients/${id}/`, { method: "DELETE" });
  if (!res.ok) {
    let message = `Failed to delete client (${res.status})`;
    try {
      const body = (await res.json()) as Record<string, unknown>;
      if (typeof body.detail === "string") message = body.detail;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
}

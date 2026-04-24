import { API_BASE } from "./client";
import type { Sheet, SheetDetail } from "../types/sheet";

export async function fetchSheets(signal?: AbortSignal): Promise<Sheet[]> {
  const res = await fetch(`${API_BASE}/sheets/`, { signal });
  if (!res.ok) throw new Error(`Failed to fetch sheets: ${res.status}`);
  return res.json() as Promise<Sheet[]>;
}

export async function fetchSheet(id: number): Promise<SheetDetail> {
  const res = await fetch(`${API_BASE}/sheets/${id}/`);
  if (!res.ok) throw new Error(`Failed to fetch sheet ${id}: ${res.status}`);
  return res.json() as Promise<SheetDetail>;
}

export async function createSheet(name: string): Promise<Sheet> {
  const res = await fetch(`${API_BASE}/sheets/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    let message = `Failed to create sheet (${res.status})`;
    try {
      const body = (await res.json()) as Record<string, unknown>;
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body.detail) && body.detail.length) {
        message = String(body.detail[0]);
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
  return res.json() as Promise<Sheet>;
}

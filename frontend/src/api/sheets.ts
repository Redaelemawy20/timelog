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

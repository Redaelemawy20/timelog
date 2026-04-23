import type { Sheet, SheetDetail } from "./types";

const BASE = "/api";

export async function fetchSheets(): Promise<Sheet[]> {
  const res = await fetch(`${BASE}/sheets/`);
  if (!res.ok) throw new Error(`Failed to fetch sheets: ${res.status}`);
  return res.json() as Promise<Sheet[]>;
}

export async function fetchSheet(id: number): Promise<SheetDetail> {
  const res = await fetch(`${BASE}/sheets/${id}/`);
  if (!res.ok) throw new Error(`Failed to fetch sheet ${id}: ${res.status}`);
  return res.json() as Promise<SheetDetail>;
}

import { API_BASE } from "./client";
import { apiFetch } from "./apiFetch";
import type { DashboardStats } from "../types/sheet";

export async function fetchDashboardStats(signal?: AbortSignal): Promise<DashboardStats> {
  const res = await apiFetch(`${API_BASE}/dashboard/stats/`, { signal });
  if (!res.ok) throw new Error(`Failed to fetch dashboard stats (${res.status})`);
  return res.json() as Promise<DashboardStats>;
}

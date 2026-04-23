import { API_BASE } from "./client";
import type { GithubTokenStatus } from "../types/github";

export async function fetchGithubTokenStatus(): Promise<GithubTokenStatus> {
  const res = await fetch(`${API_BASE}/github/token-status/`);
  if (!res.ok) throw new Error(`Failed to fetch GitHub token status: ${res.status}`);
  return res.json() as Promise<GithubTokenStatus>;
}

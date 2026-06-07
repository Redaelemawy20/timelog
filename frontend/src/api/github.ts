import { API_BASE } from "./client";
import { apiFetch } from "./apiFetch";
import type { GithubRepo, GithubTokenStatus } from "../types/github";

export async function fetchGithubTokenStatus(): Promise<GithubTokenStatus> {
  const res = await apiFetch(`${API_BASE}/github/token-status/`);
  if (!res.ok) throw new Error(`Failed to fetch GitHub token status: ${res.status}`);
  return res.json() as Promise<GithubTokenStatus>;
}

export async function fetchGithubRepos(): Promise<GithubRepo[]> {
  const res = await apiFetch(`${API_BASE}/github/repos/`);
  if (!res.ok) {
    let message = `Failed to fetch repos (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  const data = (await res.json()) as { repos: GithubRepo[] };
  return data.repos;
}

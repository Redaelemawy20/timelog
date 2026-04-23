import type { GithubTokenStatus } from "../types/github";

export function tokenTooltip(status: GithubTokenStatus): string {
  if (status.phase === "success") {
    return `GitHub token is valid (${status.login ?? "connected"})`;
  }
  if (status.phase === "not_configured") {
    return "GitHub token is not configured.";
  }
  return status.file_error || status.api_error || "GitHub token check failed.";
}

export function tokenChipLabel(status: GithubTokenStatus): string {
  if (status.phase === "success") {
    return `GitHub · ${status.login ?? "connected"}`;
  }
  return "GitHub · needs attention";
}

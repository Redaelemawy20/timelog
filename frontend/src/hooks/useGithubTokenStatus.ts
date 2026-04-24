import { useQuery } from "@tanstack/react-query";
import { fetchGithubTokenStatus } from "../api/github";
import type { GithubTokenStatus } from "../types/github";

export function useGithubTokenStatus(): GithubTokenStatus | null {
  const q = useQuery({
    queryKey: ["github", "token-status"],
    queryFn: fetchGithubTokenStatus,
    staleTime: 60_000,
    retry: false,
  });

  if (q.isPending) return null;
  if (q.isError) {
    return { phase: "api_error", api_error: "Unable to fetch token status." };
  }
  return q.data ?? null;
}

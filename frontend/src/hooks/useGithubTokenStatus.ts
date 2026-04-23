import { useEffect, useState } from "react";
import { fetchGithubTokenStatus } from "../api/github";
import type { GithubTokenStatus } from "../types/github";

export function useGithubTokenStatus(): GithubTokenStatus | null {
  const [tokenStatus, setTokenStatus] = useState<GithubTokenStatus | null>(null);

  useEffect(() => {
    fetchGithubTokenStatus()
      .then(setTokenStatus)
      .catch(() => {
        setTokenStatus({ phase: "api_error", api_error: "Unable to fetch token status." });
      });
  }, []);

  return tokenStatus;
}

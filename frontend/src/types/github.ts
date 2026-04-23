export interface GithubTokenStatus {
  phase: "not_configured" | "file_error" | "api_error" | "success";
  file_error?: string;
  api_error?: string;
  login?: string;
  name?: string | null;
}

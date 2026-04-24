export interface GithubTokenStatus {
  phase: "not_configured" | "file_error" | "api_error" | "success";
  file_error?: string;
  api_error?: string;
  login?: string;
  name?: string | null;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  owner_login: string;
  private: boolean;
  description: string | null;
  html_url: string;
  default_branch: string;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  sheet_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  client_count: number;
  sheet_count: number;
  sprint_count: number;
}

export interface SheetRepo {
  id: number;
  owner: string;
  name: string;
  display_name: string | null;
}

export interface StoredCommit {
  sha?: string;
  message?: string;
  date?: string;
}

export interface SprintRepo {
  id: number;
  repo: SheetRepo;
  project: string;
  notes: string | null;
  commit_messages: string;
  raw_commits_json: StoredCommit[] | null;
  created_at: string;
  updated_at: string;
}

export interface Sprint {
  id: number;
  range_start: string;
  range_end: string;
  status: "draft" | "saved";
  summary: string;
  time_hours: string | null;
  created_at: string;
  sprint_repos: SprintRepo[];
}

export interface Sheet {
  id: number;
  name: string;
  client: Client;
  created_at: string;
  updated_at: string;
}

export interface CreateSheetPayload {
  name: string;
  client_id: number;
}

export interface UpdateSheetPayload {
  name?: string;
  client_id?: number;
}

/** Home list row: base sheet plus quick stats for scanning. */
export interface SheetSummary extends Sheet {
  repo_count: number;
  latest_run_summary: string | null;
}

export interface SheetDetail extends Sheet {
  repos: SheetRepo[];
  sprints: Sprint[];
  share_token: string;
  is_published: boolean;
  published_at: string | null;
}

export interface PublicSprintSnapshot {
  range_start: string;
  range_end: string;
  summary: string;
  time_hours: string | null;
  projects: string[];
}

export interface PublicSheetSnapshot {
  sheet_name: string;
  client_name: string;
  published_at: string;
  total_hours: number;
  sprints: PublicSprintSnapshot[];
}

export interface CreateSprintRepoRef {
  owner: string;
  name: string;
  display_name?: string | null;
  default_branch?: string | null;
}

export interface CreateSprintPayload {
  range_start: string;
  range_end: string;
  repos: CreateSprintRepoRef[];
}

export interface UpdateSprintPayload {
  summary?: string;
  time_hours?: string | null;
}

export interface SprintConversationMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

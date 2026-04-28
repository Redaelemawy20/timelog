export interface SheetRepo {
  id: number;
  owner: string;
  name: string;
  display_name: string | null;
}

export interface LogEntry {
  id: number;
  repo: SheetRepo;
  period_start: string;
  period_end: string;
  task: string;
  time_hours: string | null;
  project: string;
  notes: string | null;
  commit_messages: string;
  created_at: string;
  updated_at: string;
}

export interface LogEntryRun {
  id: number;
  range_start: string;
  range_end: string;
  status: "draft" | "saved";
  created_at: string;
  log_entries: LogEntry[];
}

export interface Sheet {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

/** Home list row: base sheet plus quick stats for scanning. */
export interface SheetSummary extends Sheet {
  repo_count: number;
  latest_run_summary: string | null;
}

export interface SheetDetail extends Sheet {
  repos: SheetRepo[];
  log_entry_runs: LogEntryRun[];
}

export interface CreateLogEntryRunRepoRef {
  owner: string;
  name: string;
  display_name?: string | null;
  default_branch?: string | null;
}

export interface CreateLogEntryRunPayload {
  range_start: string;
  range_end: string;
  repos: CreateLogEntryRunRepoRef[];
}

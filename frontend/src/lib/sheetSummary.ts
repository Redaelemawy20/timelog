import type { Sheet, SheetSummary } from "../types/sheet";

export function sheetToSummary(sheet: Sheet): SheetSummary {
  return {
    ...sheet,
    repo_count: 0,
    latest_run_summary: null,
  };
}

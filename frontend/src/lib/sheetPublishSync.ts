import type { PublicSheetSnapshot, SheetDetail } from "../types/sheet";

type SprintSnapshotContent = {
  range_start: string;
  range_end: string;
  summary: string;
  time_hours: string | null;
  projects: string[];
};

function normalizeTimeHours(value: string | null): string | null {
  if (value == null || value === "") return null;
  return String(parseFloat(value));
}

function buildCurrentSprintContent(sheet: SheetDetail): SprintSnapshotContent[] {
  return [...sheet.sprints]
    .sort((a, b) => a.range_start.localeCompare(b.range_start))
    .map((sprint) => ({
      range_start: sprint.range_start,
      range_end: sprint.range_end,
      summary: sprint.summary,
      time_hours: normalizeTimeHours(sprint.time_hours),
      projects: sprint.sprint_repos
        .filter((repo) => repo.commit_messages?.trim())
        .map((repo) => repo.project)
        .sort(),
    }));
}

function sprintContentFromPublished(snapshot: PublicSheetSnapshot): SprintSnapshotContent[] {
  return [...snapshot.sprints]
    .sort((a, b) => a.range_start.localeCompare(b.range_start))
    .map((sprint) => ({
      range_start: sprint.range_start,
      range_end: sprint.range_end,
      summary: sprint.summary,
      time_hours: normalizeTimeHours(sprint.time_hours),
      projects: [...sprint.projects].sort(),
    }));
}

export function isSheetInSyncWithPublished(sheet: SheetDetail): boolean {
  if (!sheet.is_published || !sheet.published_snapshot) return false;
  const current = buildCurrentSprintContent(sheet);
  const published = sprintContentFromPublished(sheet.published_snapshot);
  return JSON.stringify(current) === JSON.stringify(published);
}

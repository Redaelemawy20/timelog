import type { PublicSheetSnapshot, SheetDetail } from "../types/sheet";

type SnapshotContent = {
  sheet_name: string;
  client_name: string;
  sprints: {
    range_start: string;
    range_end: string;
    summary: string;
    time_hours: string | null;
    projects: string[];
  }[];
};

function normalizeTimeHours(value: string | null): string | null {
  if (value == null || value === "") return null;
  return String(parseFloat(value));
}

function buildCurrentSnapshotContent(sheet: SheetDetail): SnapshotContent {
  const sprints = [...sheet.sprints]
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

  return {
    sheet_name: sheet.name,
    client_name: sheet.client.name,
    sprints,
  };
}

function snapshotContentFromPublished(snapshot: PublicSheetSnapshot): SnapshotContent {
  return {
    sheet_name: snapshot.sheet_name,
    client_name: snapshot.client_name,
    sprints: [...snapshot.sprints]
      .sort((a, b) => a.range_start.localeCompare(b.range_start))
      .map((sprint) => ({
        range_start: sprint.range_start,
        range_end: sprint.range_end,
        summary: sprint.summary,
        time_hours: normalizeTimeHours(sprint.time_hours),
        projects: [...sprint.projects].sort(),
      })),
  };
}

export function isSheetInSyncWithPublished(sheet: SheetDetail): boolean {
  if (!sheet.is_published || !sheet.published_snapshot) return false;
  const current = buildCurrentSnapshotContent(sheet);
  const published = snapshotContentFromPublished(sheet.published_snapshot);
  return JSON.stringify(current) === JSON.stringify(published);
}

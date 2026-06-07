import { API_BASE } from "./client";
import type {
  CreateSheetPayload,
  CreateSprintPayload,
  Sheet,
  SheetDetail,
  SprintConversationMessage,
  UpdateSprintPayload,
  UpdateSheetPayload,
} from "../types/sheet";

export async function fetchSheets(signal?: AbortSignal): Promise<Sheet[]> {
  const res = await fetch(`${API_BASE}/sheets/`, { signal });
  if (!res.ok) throw new Error(`Failed to fetch sheets: ${res.status}`);
  return res.json() as Promise<Sheet[]>;
}

export async function fetchSheet(id: number): Promise<SheetDetail> {
  const res = await fetch(`${API_BASE}/sheets/${id}/`);
  if (!res.ok) throw new Error(`Failed to fetch sheet ${id}: ${res.status}`);
  return res.json() as Promise<SheetDetail>;
}

export async function createSprint(
  sheetId: number,
  body: CreateSprintPayload,
): Promise<void> {
  const res = await fetch(`${API_BASE}/sheets/${sheetId}/sprints/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Failed to create sprint (${res.status})`;
    try {
      const parsed = (await res.json()) as Record<string, unknown>;
      if (typeof parsed.detail === "string") {
        message = parsed.detail;
      } else if (typeof parsed.detail === "object" && parsed.detail !== null) {
        message = JSON.stringify(parsed.detail);
      }
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
}

export async function createSheet(payload: CreateSheetPayload): Promise<Sheet> {
  const res = await fetch(`${API_BASE}/sheets/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let message = `Failed to create sheet (${res.status})`;
    try {
      const body = (await res.json()) as Record<string, unknown>;
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body.detail) && body.detail.length) {
        message = String(body.detail[0]);
      } else if (body.name && Array.isArray(body.name) && body.name.length) {
        message = String(body.name[0]);
      } else if (typeof body.name === "string") {
        message = body.name;
      } else if (body.client_id && Array.isArray(body.client_id) && body.client_id.length) {
        message = String(body.client_id[0]);
      }
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return res.json() as Promise<Sheet>;
}

export async function updateSheet(id: number, body: UpdateSheetPayload): Promise<Sheet> {
  const res = await fetch(`${API_BASE}/sheets/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Failed to update sheet (${res.status})`;
    try {
      const parsed = (await res.json()) as Record<string, unknown>;
      if (typeof parsed.detail === "string") message = parsed.detail;
      else if (parsed.name && Array.isArray(parsed.name) && parsed.name.length) {
        message = String(parsed.name[0]);
      } else if (parsed.client_id && Array.isArray(parsed.client_id) && parsed.client_id.length) {
        message = String(parsed.client_id[0]);
      }
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return res.json() as Promise<Sheet>;
}

export async function deleteSheet(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/sheets/${id}/`, { method: "DELETE" });
  if (!res.ok) {
    let message = `Failed to delete sheet (${res.status})`;
    try {
      const parsed = (await res.json()) as Record<string, unknown>;
      if (typeof parsed.detail === "string") message = parsed.detail;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
}

export async function updateSprint(
  sheetId: number,
  sprintId: number,
  body: UpdateSprintPayload,
): Promise<void> {
  const res = await fetch(`${API_BASE}/sheets/${sheetId}/sprints/${sprintId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Failed to update sprint (${res.status})`;
    try {
      const parsed = (await res.json()) as Record<string, unknown>;
      if (typeof parsed.detail === "string") {
        message = parsed.detail;
      } else if (Array.isArray(parsed.summary) && parsed.summary.length > 0) {
        message = String(parsed.summary[0]);
      } else if (Array.isArray(parsed.time_hours) && parsed.time_hours.length > 0) {
        message = String(parsed.time_hours[0]);
      }
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
}

export async function deleteSprint(
  sheetId: number,
  sprintId: number,
): Promise<void> {
  const res = await fetch(`${API_BASE}/sheets/${sheetId}/sprints/${sprintId}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    let message = `Failed to delete sprint (${res.status})`;
    try {
      const parsed = (await res.json()) as Record<string, unknown>;
      if (typeof parsed.detail === "string") {
        message = parsed.detail;
      }
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
}

export async function fetchSprintConversation(
  sprintId: number,
): Promise<SprintConversationMessage[]> {
  const res = await fetch(`${API_BASE}/sprints/${sprintId}/conversation/`);
  if (!res.ok) {
    let message = `Failed to fetch conversation (${res.status})`;
    try {
      const parsed = (await res.json()) as Record<string, unknown>;
      if (typeof parsed.detail === "string") {
        message = parsed.detail;
      }
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return res.json() as Promise<SprintConversationMessage[]>;
}

export async function sendSprintConversationMessage(
  sprintId: number,
  body: { content?: string; init?: boolean },
): Promise<SprintConversationMessage[]> {
  const res = await fetch(`${API_BASE}/sprints/${sprintId}/conversation/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Failed to send message (${res.status})`;
    try {
      const parsed = (await res.json()) as Record<string, unknown>;
      if (typeof parsed.detail === "string") {
        message = parsed.detail;
      }
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return res.json() as Promise<SprintConversationMessage[]>;
}

export async function exportSheetExcel(sheetId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/sheets/${sheetId}/export/`);
  if (!res.ok) {
    throw new Error(`Failed to export sheet (${res.status})`);
  }

  const blob = await res.blob();

  const contentDisposition = res.headers.get("Content-Disposition");
  let filename = "sprints.xlsx";
  if (contentDisposition) {
    const match = /filename="?([^"]+)"?/.exec(contentDisposition);
    if (match?.[1]) {
      filename = match[1];
    }
  }

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "Excel Spreadsheet",
            accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        throw err;
      }
    }
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

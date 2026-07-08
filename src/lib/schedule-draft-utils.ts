import type { ScheduleRow } from "@/types";
import { apiFetch } from "@/lib/api-client";

export const DRAFT_ROW_ID_PREFIX = "draft-";

export function isDraftScheduleRowId(id: string) {
  return id.startsWith(DRAFT_ROW_ID_PREFIX) || id.startsWith("temp-");
}

export function newDraftScheduleRowId() {
  return `${DRAFT_ROW_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function rowPayload(row: ScheduleRow): Omit<ScheduleRow, "id"> {
  return {
    projectId: row.projectId,
    service: row.service,
    part: row.part,
    taskName: row.taskName,
    startDate: row.startDate,
    endDate: row.endDate,
    sortOrder: row.sortOrder,
    remarks: row.remarks,
  };
}

function rowSignature(row: ScheduleRow) {
  return JSON.stringify(rowPayload(row));
}

export function scheduleRowsEqual(a: ScheduleRow[], b: ScheduleRow[]) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x.sortOrder - y.sortOrder);
  const sortedB = [...b].sort((x, y) => x.sortOrder - y.sortOrder);
  return sortedA.every((row, index) => rowSignature(row) === rowSignature(sortedB[index]));
}

export async function persistScheduleRowsForProject(
  projectId: string,
  draftRows: ScheduleRow[],
  serverRows: ScheduleRow[]
): Promise<ScheduleRow[]> {
  const draftIds = new Set(draftRows.map((row) => row.id));
  const serverMap = new Map(serverRows.map((row) => [row.id, row]));

  for (const row of serverRows) {
    if (!draftIds.has(row.id)) {
      await apiFetch(`/api/schedule-rows/${row.id}`, { method: "DELETE" });
    }
  }

  const saved: ScheduleRow[] = [];
  for (const row of draftRows) {
    if (isDraftScheduleRowId(row.id)) {
      const created = await apiFetch<ScheduleRow>("/api/schedule-rows", {
        method: "POST",
        body: JSON.stringify(rowPayload(row)),
      });
      saved.push(created);
      continue;
    }

    const original = serverMap.get(row.id);
    if (!original || rowSignature(original) !== rowSignature(row)) {
      const updated = await apiFetch<ScheduleRow>(`/api/schedule-rows/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify(rowPayload(row)),
      });
      saved.push(updated);
      continue;
    }

    saved.push(row);
  }

  return saved.filter((row) => row.projectId === projectId);
}

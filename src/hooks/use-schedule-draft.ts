"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ScheduleRow } from "@/types";
import {
  buildRowsFromTemplate,
  type ScheduleTemplateId,
} from "@/lib/schedule-templates";
import {
  newDraftScheduleRowId,
  persistScheduleRowsForProject,
  scheduleRowsEqual,
} from "@/lib/schedule-draft-utils";

export function useScheduleDraft(
  projectId: string,
  serverRows: ScheduleRow[],
  canEdit: boolean
) {
  const [draftRows, setDraftRows] = useState<ScheduleRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraftRows(serverRows);
    setSaveMessage(null);
  }, [projectId, serverRows]);

  const isDirty = useMemo(
    () => canEdit && !scheduleRowsEqual(draftRows, serverRows),
    [canEdit, draftRows, serverRows]
  );

  const addRow = useCallback((row: Omit<ScheduleRow, "id">) => {
    setDraftRows((prev) => [
      ...prev,
      { ...row, id: newDraftScheduleRowId() },
    ]);
    setSaveMessage(null);
  }, []);

  const updateRow = useCallback((id: string, data: Partial<ScheduleRow>) => {
    setDraftRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...data } : row))
    );
    setSaveMessage(null);
  }, []);

  const deleteRow = useCallback((id: string) => {
    setDraftRows((prev) => prev.filter((row) => row.id !== id));
    setSaveMessage(null);
  }, []);

  const applyTemplate = useCallback(
    (templateId: ScheduleTemplateId, anchorDate: string) => {
      const maxOrder = draftRows.reduce(
        (max, row) => Math.max(max, row.sortOrder),
        -1
      );
      const templateRows = buildRowsFromTemplate(
        projectId,
        templateId,
        anchorDate,
        maxOrder + 1
      ).map((row) => ({
        ...row,
        id: newDraftScheduleRowId(),
      }));
      setDraftRows((prev) => [...prev, ...templateRows]);
      setSaveMessage(null);
    },
    [draftRows, projectId]
  );

  const resetDraft = useCallback(() => {
    setDraftRows(serverRows);
    setSaveMessage(null);
  }, [serverRows]);

  const saveDraft = useCallback(
    async (onSaved: (rows: ScheduleRow[]) => void) => {
      if (!canEdit || !isDirty || saving) return false;
      setSaving(true);
      setSaveMessage(null);
      try {
        const saved = await persistScheduleRowsForProject(
          projectId,
          draftRows,
          serverRows
        );
        setDraftRows(saved);
        onSaved(saved);
        setSaveMessage("저장되었습니다.");
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "저장에 실패했습니다.";
        setSaveMessage(message);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [canEdit, draftRows, isDirty, projectId, saving, serverRows]
  );

  const confirmDiscard = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm(
      "저장하지 않은 변경이 있습니다. 변경 내용을 버리고 계속할까요?"
    );
  }, [isDirty]);

  return {
    draftRows,
    isDirty,
    saving,
    saveMessage,
    addRow,
    updateRow,
    deleteRow,
    applyTemplate,
    resetDraft,
    saveDraft,
    confirmDiscard,
  };
}

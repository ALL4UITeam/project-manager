"use client";

import {
  FormDialogHeader,
  FormDialogSection,
  FormField,
  formInputClassName,
} from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/app-context";
import type { ScheduleRow, WorkPart } from "@/types";
import { WORK_PARTS } from "@/types";
import { CalendarRange, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type FormState = {
  service: string;
  part: WorkPart;
  taskName: string;
  startDate: string;
  endDate: string;
  remarks: string;
};

const emptyForm = (): FormState => ({
  service: "Mobile",
  part: "기획",
  taskName: "",
  startDate: "",
  endDate: "",
  remarks: "",
});

function rowToForm(row: ScheduleRow): FormState {
  return {
    service: row.service,
    part: row.part,
    taskName: row.taskName,
    startDate: row.startDate,
    endDate: row.endDate,
    remarks: row.remarks ?? "",
  };
}

export function ScheduleRowDialog({
  open,
  onOpenChange,
  projectId,
  editing,
  defaultService,
  serviceSuggestions = [],
  rowsForOrder,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  editing?: ScheduleRow | null;
  defaultService?: string;
  serviceSuggestions?: string[];
  rowsForOrder?: ScheduleRow[];
  onAddRow?: (row: Omit<ScheduleRow, "id">) => void;
  onUpdateRow?: (id: string, data: Partial<ScheduleRow>) => void;
  onDeleteRow?: (id: string) => void;
}) {
  const {
    scheduleRows,
    addScheduleRow,
    updateScheduleRow,
    deleteScheduleRow,
  } = useApp();
  const orderRows = rowsForOrder ?? scheduleRows;
  const useDraftHandlers = !!onAddRow && !!onUpdateRow && !!onDeleteRow;
  const [form, setForm] = useState<FormState>(emptyForm());

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm(rowToForm(editing));
    } else {
      setForm({ ...emptyForm(), service: defaultService ?? "Mobile" });
    }
  }, [open, editing, defaultService]);

  const handleSave = () => {
    if (!form.taskName.trim() || !form.startDate || !form.endDate) return;
    if (form.startDate > form.endDate) return;

    const payload = {
      projectId,
      service: form.service.trim(),
      part: form.part,
      taskName: form.taskName.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      remarks: form.remarks.trim() || undefined,
      sortOrder: editing?.sortOrder ?? orderRows.length,
    };

    if (useDraftHandlers) {
      if (editing) {
        onUpdateRow(editing.id, payload);
      } else {
        onAddRow(payload);
      }
    } else if (editing) {
      updateScheduleRow(editing.id, payload);
    } else {
      addScheduleRow(payload);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!editing) return;
    if (useDraftHandlers) {
      onDeleteRow(editing.id);
    } else {
      deleteScheduleRow(editing.id);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <FormDialogHeader
          icon={CalendarRange}
          accent="emerald"
          title={editing ? "일정 행 수정" : "일정 행 추가"}
          description={
            editing
              ? "서비스 · 파트 · 상세업무와 기간을 입력합니다."
              : "같은 서비스 아래 디자인·퍼블 등을 추가하려면 서비스명을 동일하게 입력하고, 구분(파트)만 바꿔 새 행을 추가하세요."
          }
          badge={editing ? "수정" : "신규"}
        />

        <DialogBody className="space-y-3">
          <FormDialogSection title="WBS 정보">
            <FormField
              label="서비스"
              required
              hint="예: GIS 서비스 — 같은 이름이면 한 그룹으로 묶입니다"
            >
              <Input
                className={formInputClassName()}
                list={
                  serviceSuggestions.length > 0
                    ? "schedule-service-suggestions"
                    : undefined
                }
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
                placeholder="GIS 서비스"
              />
              {serviceSuggestions.length > 0 && (
                <datalist id="schedule-service-suggestions">
                  {serviceSuggestions.map((service) => (
                    <option key={service} value={service} />
                  ))}
                </datalist>
              )}
            </FormField>

            <FormField label="구분 (파트)" required>
              <Select
                value={form.part}
                onValueChange={(v) =>
                  setForm({ ...form, part: v as WorkPart })
                }
              >
                <SelectTrigger className={formInputClassName()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_PARTS.map((part) => (
                    <SelectItem key={part} value={part}>
                      {part}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="상세업무" required>
              <Input
                className={formInputClassName()}
                value={form.taskName}
                onChange={(e) =>
                  setForm({ ...form, taskName: e.target.value })
                }
                placeholder="예: 상세설계"
                autoFocus
              />
            </FormField>
          </FormDialogSection>

          <FormDialogSection title="기간">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="시작일" required>
                <Input
                  type="date"
                  className={formInputClassName()}
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </FormField>
              <FormField label="종료일" required>
                <Input
                  type="date"
                  className={formInputClassName()}
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </FormField>
            </div>
          </FormDialogSection>

          <FormField label="비고" hint="간트 우측 열">
            <Textarea
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="마일스톤·참고 사항"
              rows={2}
              className="border-border/70 bg-background/90 shadow-sm"
            />
          </FormField>
        </DialogBody>

        <DialogFooter className={editing ? "sm:justify-between" : undefined}>
          {editing ? (
            <Button
              type="button"
              variant="destructive"
              className="sm:mr-auto"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </Button>
          ) : (
            <span />
          )}
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !form.taskName.trim() ||
                !form.startDate ||
                !form.endDate ||
                form.startDate > form.endDate
              }
            >
              {useDraftHandlers ? "적용" : editing ? "저장" : "등록"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

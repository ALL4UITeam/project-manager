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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/app-context";
import type { CalendarMilestone } from "@/types";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarPlus, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";

type FormState = {
  title: string;
  date: string;
  projectId: string;
  description: string;
  isShared: boolean;
  isTeamAdmin: boolean;
};

const emptyForm = (date: string): FormState => ({
  title: "",
  date,
  projectId: "",
  description: "",
  isShared: false,
  isTeamAdmin: false,
});

function milestoneToForm(m: CalendarMilestone): FormState {
  return {
    title: m.title,
    date: m.date,
    projectId: m.projectId ?? "",
    description: m.description ?? "",
    isShared: m.isShared,
    isTeamAdmin: m.isTeamAdmin ?? false,
  };
}

export function CalendarEventDialog({
  open,
  onOpenChange,
  selectedDate,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  editing?: CalendarMilestone | null;
  onSaved?: () => void;
}) {
  const {
    projects,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    getProjectById,
  } = useApp();
  const [form, setForm] = useState<FormState>(emptyForm(selectedDate));

  useEffect(() => {
    if (!open) return;
    setForm(editing ? milestoneToForm(editing) : emptyForm(selectedDate));
  }, [open, selectedDate, editing]);

  const handleSave = () => {
    if (!form.title.trim()) return;

    const payload = {
      title: form.title.trim(),
      date: form.date,
      projectId: form.projectId || undefined,
      description: form.description.trim() || undefined,
      isShared: form.isShared,
      isTeamAdmin: form.isTeamAdmin,
    };

    if (editing) {
      updateMilestone(editing.id, payload);
    } else {
      addMilestone(payload);
    }
    onSaved?.();
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!editing) return;
    deleteMilestone(editing.id);
    onSaved?.();
    onOpenChange(false);
  };

  const dateLabel = form.date
    ? format(parseISO(form.date), "yyyy년 M월 d일 (EEE)", { locale: ko })
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <FormDialogHeader
          icon={CalendarPlus}
          accent="emerald"
          title={editing ? "일정 수정" : "일정 등록"}
          description={
            editing
              ? "등록한 일정을 수정하거나 삭제할 수 있습니다."
              : `${dateLabel} · 클릭한 날짜에 일정을 추가합니다.`
          }
          badge={editing ? "수정" : "신규"}
        />

        <DialogBody className="space-y-3">
          <FormDialogSection title="일정 정보">
            <FormField label="제목" required>
              <Input
                className={formInputClassName()}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예: 메인 비주얼 1차 시안 마감"
                autoFocus
              />
            </FormField>

            <FormField label="날짜" required>
              <Input
                type="date"
                className={formInputClassName()}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </FormField>

            <FormField label="프로젝트" hint="선택">
              <Select
                value={form.projectId || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, projectId: v === "none" ? "" : v })
                }
              >
                <SelectTrigger className={formInputClassName()}>
                  <SelectValue placeholder="프로젝트 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">프로젝트 없음</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="font-numeric">{p.code}</span>
                      <span className="text-muted-foreground"> · {p.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="메모" hint="선택">
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="상세 내용을 입력하세요"
                rows={2}
                className="border-border/70 bg-background/90 shadow-sm"
              />
            </FormField>
          </FormDialogSection>

          <div className="flex items-center justify-between rounded-xl border border-violet-500/25 bg-violet-500/5 px-4 py-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <Label htmlFor="team-admin" className="text-sm font-semibold">
                  UI팀 관리 일정
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  연차·팀 일정 등 (보라색 표시, 선택)
                </p>
              </div>
            </div>
            <input
              id="team-admin"
              type="checkbox"
              checked={form.isTeamAdmin}
              onChange={(e) =>
                setForm({ ...form, isTeamAdmin: e.target.checked })
              }
              className="size-4 rounded border-border accent-violet-600"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <div>
              <Label htmlFor="cal-shared" className="text-sm font-semibold">
                외부 협력 공유
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                외부 계정에서도 이 일정을 볼 수 있습니다
              </p>
            </div>
            <input
              id="cal-shared"
              type="checkbox"
              checked={form.isShared}
              onChange={(e) =>
                setForm({ ...form, isShared: e.target.checked })
              }
              className="size-4 rounded border-border accent-primary"
            />
          </div>

          {form.projectId && (
            <p className="text-xs text-muted-foreground">
              프로젝트:{" "}
              <span className="font-medium text-foreground">
                {getProjectById(form.projectId)?.code} ·{" "}
                {getProjectById(form.projectId)?.name}
              </span>
            </p>
          )}
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
            <Button
              variant="outline"
              className="min-w-24"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              className="min-w-24 shadow-sm shadow-primary/20"
              onClick={handleSave}
              disabled={!form.title.trim() || !form.date}
            >
              {editing ? "저장" : "등록"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

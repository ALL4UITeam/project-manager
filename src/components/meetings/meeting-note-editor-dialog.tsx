"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { FileText, Link2 } from "lucide-react";
import type { MeetingNote, Project } from "@/types";
import { useApp } from "@/context/app-context";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FormDialogHeader,
  FormDialogSection,
  FormField,
  formInputClassName,
} from "@/components/shared/form-dialog";
import { Label } from "@/components/ui/label";

type FormState = {
  title: string;
  date: string;
  content: string;
  linkShareEnabled: boolean;
};

export function MeetingNoteEditorDialog({
  open,
  onOpenChange,
  project,
  note,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  note?: MeetingNote;
  onSaved?: (note: MeetingNote) => void;
}) {
  const { addMeetingNote, updateMeetingNote } = useApp();
  const [form, setForm] = useState<FormState>({
    title: "",
    date: format(new Date("2026-06-18"), "yyyy-MM-dd"),
    content: "<p></p>",
    linkShareEnabled: false,
  });

  useEffect(() => {
    if (!open) return;
    if (note) {
      setForm({
        title: note.title,
        date: note.date,
        content: note.content,
        linkShareEnabled: note.linkShareEnabled,
      });
    } else {
      setForm({
        title: "",
        date: format(new Date("2026-06-18"), "yyyy-MM-dd"),
        content: "<p></p>",
        linkShareEnabled: false,
      });
    }
  }, [open, note]);

  const handleSave = () => {
    if (!form.title.trim() || !form.content.replace(/<[^>]+>/g, "").trim()) {
      return;
    }

    if (note) {
      updateMeetingNote(note.id, {
        title: form.title.trim(),
        date: form.date,
        content: form.content,
        linkShareEnabled: form.linkShareEnabled,
      });
      onSaved?.({ ...note, ...form, title: form.title.trim() });
    } else {
      const created = addMeetingNote({
        projectId: project.id,
        title: form.title.trim(),
        date: form.date,
        content: form.content,
        linkShareEnabled: form.linkShareEnabled,
      });
      onSaved?.(created);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <FormDialogHeader
          icon={FileText}
          accent="rose"
          title={note ? "회의록 수정" : "회의록 작성"}
          description={`${project.code} · ${project.name}`}
          badge={note ? "수정" : "신규"}
        />

        <DialogBody className="space-y-4">
          <FormDialogSection title="회의 정보">
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <FormField label="제목" required>
                <Input
                  className={formInputClassName()}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="6월 3주차 주간 업무 보고 회의"
                />
              </FormField>
              <FormField label="회의일" required>
                <Input
                  type="date"
                  className={formInputClassName()}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </FormField>
            </div>
          </FormDialogSection>

          <FormDialogSection
            title="회의 내용"
            description="에디터로 안건·결정 사항·액션 아이템을 작성하세요."
          >
            <RichTextEditor
              value={form.content}
              onChange={(html) => setForm({ ...form, content: html })}
            />
          </FormDialogSection>

          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3.5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Link2 className="h-4 w-4" />
              </div>
              <div>
                <Label
                  htmlFor="link-share"
                  className="cursor-pointer text-sm font-semibold"
                >
                  링크 공유 허용
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  저장 후 링크를 가진 누구나 조회할 수 있습니다
                </p>
              </div>
            </div>
            <Switch
              id="link-share"
              checked={form.linkShareEnabled}
              onCheckedChange={(checked) =>
                setForm({ ...form, linkShareEnabled: checked })
              }
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" className="min-w-24" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            className="min-w-28 shadow-sm shadow-primary/20"
            onClick={handleSave}
            disabled={
              !form.title.trim() ||
              !form.content.replace(/<[^>]+>/g, "").trim()
            }
          >
            {note ? "수정 저장" : "작성 완료"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { MeetingNote, Project } from "@/types";
import { useApp } from "@/context/app-context";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {note ? "회의록 수정" : "회의록 작성"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {project.code} · {project.name}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="6월 3주차 주간 업무 보고 회의"
              />
            </div>
            <div className="space-y-2">
              <Label>회의일</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>내용</Label>
            <RichTextEditor
              value={form.content}
              onChange={(html) => setForm({ ...form, content: html })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.linkShareEnabled}
              onChange={(e) =>
                setForm({ ...form, linkShareEnabled: e.target.checked })
              }
              className="rounded border-border"
            />
            저장 후 링크 공유 허용 (링크를 가진 누구나 조회)
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
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

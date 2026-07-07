"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, FileText, Link2, Save } from "lucide-react";
import type { MeetingNote } from "@/types";
import { useApp } from "@/context/app-context";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import {
  meetingsListPath,
  meetingsViewPath,
} from "@/lib/app-routes";
import { PageHeader } from "@/components/shared/page-header";
import {
  FormDialogSection,
  FormField,
  formInputClassName,
} from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type FormState = {
  title: string;
  date: string;
  meetingTime: string;
  authorName: string;
  location: string;
  participants: string;
  content: string;
  linkShareEnabled: boolean;
};

const emptyForm = (): FormState => ({
  title: "",
  date: format(new Date(), "yyyy-MM-dd"),
  meetingTime: "14:00",
  authorName: "",
  location: "",
  participants: "",
  content: "<p></p>",
  linkShareEnabled: false,
});

function MeetingNoteEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "";
  const noteId = searchParams.get("noteId") ?? "";

  const {
    projects,
    meetingNotes,
    currentUser,
    getUserById,
    addMeetingNote,
    updateMeetingNote,
    canEditMeetingNote,
  } = useApp();

  const project = projects.find((p) => p.id === projectId);
  const existingNote = noteId
    ? meetingNotes.find((n) => n.id === noteId)
    : undefined;

  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!canEditMeetingNote()) {
      router.replace(meetingsListPath());
      return;
    }
    if (noteId && existingNote) {
      if (existingNote.projectId !== projectId && projectId) return;
      setForm({
        title: existingNote.title,
        date: existingNote.date,
        meetingTime: existingNote.meetingTime,
        authorName: existingNote.authorName,
        location: existingNote.location,
        participants: existingNote.participants,
        content: existingNote.content,
        linkShareEnabled: existingNote.linkShareEnabled,
      });
    } else if (currentUser && !noteId) {
      setForm((prev) => ({
        ...prev,
        authorName: getUserById(currentUser.id)?.name ?? "",
      }));
    }
  }, [
    noteId,
    existingNote,
    currentUser,
    getUserById,
    canEditMeetingNote,
    router,
    projectId,
  ]);

  const resolvedProject =
    project ?? (existingNote ? projects.find((p) => p.id === existingNote.projectId) : null);

  const isValid = useMemo(() => {
    return (
      form.title.trim() &&
      form.date &&
      form.meetingTime.trim() &&
      form.authorName.trim() &&
      form.location.trim() &&
      form.participants.trim() &&
      form.content.replace(/<[^>]+>/g, "").trim()
    );
  }, [form]);

  if (!resolvedProject) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">프로젝트를 찾을 수 없습니다</p>
        <Button variant="outline" onClick={() => router.push(meetingsListPath())}>
          회의록 목록
        </Button>
      </div>
    );
  }

  if (noteId && !existingNote) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">회의록을 찾을 수 없습니다</p>
        <Button variant="outline" onClick={() => router.push(meetingsListPath())}>
          회의록 목록
        </Button>
      </div>
    );
  }

  const handleSave = () => {
    if (!isValid) return;

    const payload = {
      projectId: resolvedProject.id,
      title: form.title.trim(),
      date: form.date,
      meetingTime: form.meetingTime.trim(),
      authorName: form.authorName.trim(),
      location: form.location.trim(),
      participants: form.participants.trim(),
      content: form.content,
      linkShareEnabled: form.linkShareEnabled,
    };

    let saved: MeetingNote;
    if (existingNote) {
      updateMeetingNote(existingNote.id, payload);
      saved = { ...existingNote, ...payload };
    } else {
      saved = addMeetingNote(payload);
    }
    router.replace(meetingsViewPath(saved.id, resolvedProject.id));
  };

  const listPath = meetingsListPath({ projectId: resolvedProject.id });
  const viewPath = noteId
    ? meetingsViewPath(noteId, resolvedProject.id)
    : listPath;

  return (
    <div className="page-stack pb-10">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit"
        onClick={() => router.push(viewPath)}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        {noteId ? "회의록 보기" : "회의록 목록"}
      </Button>

      <PageHeader
        icon={FileText}
        iconClassName="bg-rose-500/10 text-rose-600 ring-rose-500/15"
        title={existingNote ? "회의록 수정" : "회의록 작성"}
        description={`${resolvedProject.code} · ${resolvedProject.name}`}
      />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <FormDialogSection title="회의 정보" description="표시 양식에 그대로 반영됩니다">
            <FormField label="회의주제" required>
              <Input
                className={formInputClassName()}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="국가유산 해설 솔루션 UI 완료 리뷰 및 수정 사항 확인"
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="회의일" required>
                <Input
                  type="date"
                  className={formInputClassName()}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </FormField>
              <FormField label="회의 시각" required>
                <Input
                  type="time"
                  className={formInputClassName()}
                  value={form.meetingTime}
                  onChange={(e) =>
                    setForm({ ...form, meetingTime: e.target.value })
                  }
                />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="작성자" required>
                <Input
                  className={formInputClassName()}
                  value={form.authorName}
                  onChange={(e) =>
                    setForm({ ...form, authorName: e.target.value })
                  }
                  placeholder="김찬기 과장"
                />
              </FormField>
              <FormField label="회의장소" required>
                <Input
                  className={formInputClassName()}
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="올포랜드 901호"
                />
              </FormField>
            </div>
            <FormField label="참석자" required>
              <Textarea
                value={form.participants}
                onChange={(e) =>
                  setForm({ ...form, participants: e.target.value })
                }
                placeholder={`공통개발그룹 : 안용근 수석, 정종덕 과장\nUIUX팀 : 김일호 수석, 김찬기 과장`}
                rows={4}
                className={formInputClassName("min-h-[100px] resize-y")}
              />
            </FormField>
          </FormDialogSection>

          <FormDialogSection
            title="안건 및 협의내용"
            description="번호·목록 등은 에디터로 작성하세요"
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
                <Label htmlFor="link-share" className="cursor-pointer text-sm font-semibold">
                  링크 공유 허용
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  저장 후 링크를 가진 누구나 동일 양식으로 조회할 수 있습니다
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

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => router.push(viewPath)}
            >
              취소
            </Button>
            <Button onClick={handleSave} disabled={!isValid}>
              <Save className="mr-1.5 h-4 w-4" />
              {existingNote ? "수정 저장" : "작성 완료"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MeetingNoteEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <MeetingNoteEditorContent />
    </Suspense>
  );
}

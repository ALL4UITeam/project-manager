"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, FileText, Globe, Lock } from "lucide-react";
import type { MeetingNote, Project } from "@/types";
import { useApp } from "@/context/app-context";
import { RichTextContent } from "@/components/editor/rich-text-content";
import { MeetingNoteSharePanel } from "@/components/meetings/meeting-note-share-panel";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SharedMeetingNoteView({
  note,
  project,
}: {
  note: MeetingNote;
  project?: Project;
}) {
  const { getUserById } = useApp();
  const author = getUserById(note.authorId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="text-center">
        <Badge variant="secondary" className="mb-4 gap-1">
          <Globe className="h-3 w-3" />
          공유 회의록 · 조회 전용
        </Badge>
        <h1 className="text-2xl font-bold leading-snug">{note.title}</h1>
        <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {format(parseISO(note.date), "yyyy년 M월 d일 (EEE)", { locale: ko })}
          </span>
          {project && (
            <>
              <span>·</span>
              <span className="font-mono text-primary">{project.code}</span>
              <span>{project.name}</span>
            </>
          )}
          {author && (
            <>
              <span>·</span>
              <span>작성 {author.name}</span>
            </>
          )}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <RichTextContent html={note.content} />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        이 페이지는 링크를 통해 공유된 회의록입니다. 수정은 팀 계정으로 로그인한
        사용자만 가능합니다.
      </p>
    </div>
  );
}

export function MeetingNoteDetail({
  note,
  project,
  onBack,
  onEdit,
}: {
  note: MeetingNote;
  project: Project;
  onBack: () => void;
  onEdit: () => void;
}) {
  const { getUserById, canEditMeetingNote, deleteMeetingNote } = useApp();
  const author = getUserById(note.authorId);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← 회의록 목록
      </button>

      <Card>
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl leading-snug">{note.title}</CardTitle>
              <CardDescription className="mt-2 flex flex-wrap items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                {format(parseISO(note.date), "yyyy년 M월 d일 (EEE)", {
                  locale: ko,
                })}
                {author && ` · ${author.name}`}
                <span>· {project.code}</span>
              </CardDescription>
            </div>
            {note.linkShareEnabled ? (
              <Badge variant="secondary" className="gap-1">
                <Globe className="h-3 w-3" />
                링크 공개
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                비공개
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <RichTextContent html={note.content} />
        </CardContent>
      </Card>

      <MeetingNoteSharePanel note={note} />

      {canEditMeetingNote() && (
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50"
            onClick={onEdit}
          >
            수정
          </button>
          <button
            type="button"
            className="rounded-lg border border-destructive/30 px-4 py-2 text-sm text-destructive hover:bg-destructive/5"
            onClick={() => {
              if (window.confirm("이 회의록을 삭제할까요?")) {
                deleteMeetingNote(note.id);
                onBack();
              }
            }}
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}

export function MeetingNoteListItem({
  note,
  onClick,
}: {
  note: MeetingNote;
  onClick: () => void;
}) {
  const { getUserById } = useApp();
  const author = getUserById(note.authorId);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold leading-snug">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            {note.title}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {format(parseISO(note.date), "yyyy.M.d (EEE)", { locale: ko })}
            {author && ` · ${author.name}`}
          </p>
        </div>
        {note.linkShareEnabled ? (
          <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]">
            <Globe className="h-3 w-3" />
            공유
          </Badge>
        ) : null}
      </div>
    </button>
  );
}

export function useMeetingNoteProject(projectId: string) {
  const { projects } = useApp();
  return useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId]
  );
}

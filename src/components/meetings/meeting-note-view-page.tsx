"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Globe, Lock } from "lucide-react";
import type { MeetingNote, Project } from "@/types";
import { useApp } from "@/context/app-context";
import { MeetingMinutesDocument } from "@/components/meetings/meeting-minutes-document";
import { MeetingNoteSharePanel } from "@/components/meetings/meeting-note-share-panel";
import {
  meetingsListPath,
  meetingsWritePath,
} from "@/lib/app-routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MeetingNoteViewPage({
  note,
  project,
  showShareBadge = true,
}: {
  note: MeetingNote;
  project: Project;
  showShareBadge?: boolean;
}) {
  const router = useRouter();
  const { canEditMeetingNote, deleteMeetingNote } = useApp();

  const listPath = meetingsListPath({ projectId: project.id });

  return (
    <div className="page-stack pb-10">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit"
        onClick={() => router.push(listPath)}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        회의록 목록
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-semibold text-primary">
            {project.code}
          </p>
          <p className="text-sm text-muted-foreground">{project.name}</p>
        </div>
        {showShareBadge &&
          (note.linkShareEnabled ? (
            <Badge variant="secondary" className="gap-1">
              <Globe className="h-3 w-3" />
              링크 공개
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" />
              비공개
            </Badge>
          ))}
      </div>

      <div className="overflow-x-auto rounded-lg bg-white p-4 shadow-sm ring-1 ring-border/60 sm:p-6">
        <MeetingMinutesDocument note={note} />
      </div>

      <MeetingNoteSharePanel note={note} />

      {canEditMeetingNote() && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(meetingsWritePath(project.id, note.id))
            }
          >
            수정
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/5"
            onClick={() => {
              if (window.confirm("이 회의록을 삭제할까요?")) {
                deleteMeetingNote(note.id);
                router.push(listPath);
              }
            }}
          >
            삭제
          </Button>
        </div>
      )}
    </div>
  );
}

export function SharedMeetingNoteView({
  note,
  project,
}: {
  note: MeetingNote;
  project?: Project;
}) {
  return (
    <div className="mx-auto max-w-[960px] space-y-6 px-4 py-8">
      <div className="text-center">
        <Badge variant="secondary" className="mb-4 gap-1">
          <Globe className="h-3 w-3" />
          공유 회의록 · 조회 전용
        </Badge>
        {project && (
          <p className="text-xs text-muted-foreground">
            <span className="font-mono font-semibold text-primary">
              {project.code}
            </span>{" "}
            · {project.name}
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg bg-white p-4 shadow-sm ring-1 ring-border/60 sm:p-6">
        <MeetingMinutesDocument note={note} />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        이 페이지는 링크를 통해 공유된 회의록입니다. 수정은 팀 계정으로 로그인한
        사용자만 가능합니다.
      </p>
    </div>
  );
}

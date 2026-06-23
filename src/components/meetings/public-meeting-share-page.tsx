"use client";

import { FileX2 } from "lucide-react";
import { useApp } from "@/context/app-context";
import { SharedMeetingNoteView } from "@/components/meetings/meeting-note-detail";

export function PublicMeetingSharePage({ token }: { token: string }) {
  const { getMeetingNoteByShareToken, getProjectById } = useApp();
  const note = getMeetingNoteByShareToken(token);
  const project = note ? getProjectById(note.projectId) : undefined;

  if (!note) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
        <FileX2 className="h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">회의록을 찾을 수 없습니다</h1>
        <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
          링크가 만료되었거나, 공유가 해제되었거나, 주소가 올바르지 않을 수
          있습니다.
        </p>
      </div>
    );
  }

  return <SharedMeetingNoteView note={note} project={project} />;
}

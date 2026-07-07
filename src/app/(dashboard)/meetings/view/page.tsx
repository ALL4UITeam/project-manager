"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/app-context";
import { meetingsListPath } from "@/lib/app-routes";
import { MeetingNoteViewPage } from "@/components/meetings/meeting-note-view-page";

function MeetingNoteViewRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = searchParams.get("noteId") ?? "";
  const projectId = searchParams.get("projectId") ?? "";

  const { meetingNotes, projects } = useApp();
  const note = meetingNotes.find((n) => n.id === noteId);
  const project =
    projects.find((p) => p.id === (projectId || note?.projectId)) ?? null;

  if (!note || !project) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">회의록을 찾을 수 없습니다</p>
        <button
          type="button"
          className="text-sm text-primary underline"
          onClick={() => router.push(meetingsListPath())}
        >
          목록으로
        </button>
      </div>
    );
  }

  return <MeetingNoteViewPage note={note} project={project} />;
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <MeetingNoteViewRoute />
    </Suspense>
  );
}

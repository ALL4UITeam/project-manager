"use client";

import { useEffect, useState } from "react";
import { FileX2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { SharedMeetingNoteView } from "@/components/meetings/meeting-note-view-page";
import type { MeetingNote, Project } from "@/types";

export function PublicMeetingSharePage({ token }: { token: string }) {
  const [note, setNote] = useState<MeetingNote | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{
          note: MeetingNote;
          project: Project | null;
        }>(`/api/share/meetings/${encodeURIComponent(token)}`);
        if (cancelled) return;
        setNote(data.note);
        setProject(data.project);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound || !note) {
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

  return <SharedMeetingNoteView note={note} project={project ?? undefined} />;
}

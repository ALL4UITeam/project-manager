"use client";

import { FileText, Globe } from "lucide-react";
import type { MeetingNote } from "@/types";
import { formatMeetingDateTime } from "@/lib/meeting-note-utils";
import { Badge } from "@/components/ui/badge";

export { SharedMeetingNoteView } from "@/components/meetings/meeting-note-view-page";

export function MeetingNoteListItem({
  note,
  onClick,
}: {
  note: MeetingNote;
  onClick: () => void;
}) {
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
            {formatMeetingDateTime(note.date, note.meetingTime)}
            {` · ${note.authorName}`}
            {note.location ? ` · ${note.location}` : ""}
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

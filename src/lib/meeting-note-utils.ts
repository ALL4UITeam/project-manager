import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import type { MeetingNote, User } from "@/types";

export function formatMeetingDateTime(date: string, meetingTime: string) {
  const d = parseISO(date);
  const dayLabel = format(d, "yyyy.MM.dd(EEE)", { locale: ko });
  const timeLabel = meetingTime
    ? meetingTime.includes("시")
      ? meetingTime
      : `${meetingTime.replace(/^(\d{1,2}):(\d{2})$/, (_, h, m) =>
          m === "00" ? `${parseInt(h, 10)}시` : `${parseInt(h, 10)}:${m}`
        )}`
    : "";
  return timeLabel ? `${dayLabel} ${timeLabel}` : dayLabel;
}

export function normalizeMeetingNote(
  note: Partial<MeetingNote> & Pick<MeetingNote, "id" | "projectId" | "title" | "date" | "content" | "authorId" | "shareToken" | "linkShareEnabled">,
  getUser?: (id: string) => User | undefined
): MeetingNote {
  const author = getUser?.(note.authorId);
  return {
    id: note.id,
    projectId: note.projectId,
    title: note.title,
    date: note.date,
    meetingTime: note.meetingTime ?? "14:00",
    authorName: note.authorName ?? author?.name ?? "—",
    location: note.location ?? "올포랜드",
    participants: note.participants ?? author?.name ?? "—",
    content: note.content,
    authorId: note.authorId,
    shareToken: note.shareToken,
    linkShareEnabled: note.linkShareEnabled,
  };
}

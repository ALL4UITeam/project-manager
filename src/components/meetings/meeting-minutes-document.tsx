"use client";

import type { MeetingNote } from "@/types";
import { formatMeetingDateTime } from "@/lib/meeting-note-utils";
import { RichTextContent } from "@/components/editor/rich-text-content";
import { cn } from "@/lib/utils";

const labelCell =
  "w-[110px] shrink-0 border border-neutral-400 bg-neutral-100 px-3 py-2.5 text-center text-sm font-semibold text-neutral-800";
const valueCell =
  "border border-neutral-400 bg-white px-3 py-2.5 text-sm text-neutral-900";
const sectionHead =
  "border border-neutral-400 bg-neutral-100 px-3 py-2.5 text-center text-sm font-bold text-neutral-900";

export function MeetingMinutesDocument({
  note,
  className,
}: {
  note: Pick<
    MeetingNote,
    | "title"
    | "date"
    | "meetingTime"
    | "authorName"
    | "location"
    | "participants"
    | "content"
  >;
  className?: string;
}) {
  const dateTimeLabel = formatMeetingDateTime(note.date, note.meetingTime);

  return (
    <div className={cn("mx-auto w-full max-w-[920px]", className)}>
      <table className="w-full border-collapse text-sm">
        <tbody>
          <tr>
            <td className={labelCell}>회의주제</td>
            <td className={cn(valueCell, "font-medium")} colSpan={3}>
              {note.title}
            </td>
          </tr>
          <tr>
            <td className={labelCell}>회의일시</td>
            <td className={valueCell}>{dateTimeLabel}</td>
            <td className={cn(labelCell, "w-[90px]")}>작성자</td>
            <td className={valueCell}>{note.authorName}</td>
          </tr>
          <tr>
            <td className={labelCell}>회의장소</td>
            <td className={valueCell} colSpan={3}>
              {note.location}
            </td>
          </tr>
          <tr>
            <td className={cn(labelCell, "align-top")}>참석자</td>
            <td
              className={cn(valueCell, "whitespace-pre-wrap leading-relaxed")}
              colSpan={3}
            >
              {note.participants}
            </td>
          </tr>
          <tr>
            <td className={sectionHead} colSpan={4}>
              안건 및 협의내용
            </td>
          </tr>
          <tr>
            <td className={cn(valueCell, "min-h-[320px] align-top py-4")} colSpan={4}>
              <RichTextContent html={note.content} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

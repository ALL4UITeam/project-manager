import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, newId, parseBody } from "@/lib/api-utils";
import { toMeetingNote } from "@/lib/db-mappers";
import { generateShareToken } from "@/lib/meeting-utils";
import type { MeetingNote } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await parseBody<
    Omit<MeetingNote, "id" | "authorId" | "shareToken"> & { authorId: string }
  >(request);

  if (!body?.projectId || !body?.authorId || !body?.title) {
    return jsonError("필수 항목이 누락되었습니다", 400);
  }

  const row = await prisma.meetingNote.create({
    data: {
      id: newId("mn"),
      projectId: body.projectId,
      title: body.title,
      date: body.date,
      meetingTime: body.meetingTime,
      authorName: body.authorName,
      location: body.location,
      participants: body.participants,
      content: body.content,
      authorId: body.authorId,
      shareToken: generateShareToken(),
      linkShareEnabled: body.linkShareEnabled ?? false,
    },
  });

  return jsonOk(toMeetingNote(row), 201);
}

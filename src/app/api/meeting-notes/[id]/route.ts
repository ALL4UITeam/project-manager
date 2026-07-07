import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { toMeetingNote } from "@/lib/db-mappers";
import type { MeetingNote } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await parseBody<Partial<MeetingNote>>(request);
  if (!body) return jsonError("잘못된 요청", 400);

  try {
    const row = await prisma.meetingNote.update({
      where: { id },
      data: {
        ...(body.projectId !== undefined ? { projectId: body.projectId } : {}),
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.date !== undefined ? { date: body.date } : {}),
        ...(body.meetingTime !== undefined ? { meetingTime: body.meetingTime } : {}),
        ...(body.authorName !== undefined ? { authorName: body.authorName } : {}),
        ...(body.location !== undefined ? { location: body.location } : {}),
        ...(body.participants !== undefined ? { participants: body.participants } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.linkShareEnabled !== undefined
          ? { linkShareEnabled: body.linkShareEnabled }
          : {}),
      },
    });
    return jsonOk(toMeetingNote(row));
  } catch {
    return jsonError("회의록을 찾을 수 없습니다", 404);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await prisma.meetingNote.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonError("회의록을 찾을 수 없습니다", 404);
  }
}

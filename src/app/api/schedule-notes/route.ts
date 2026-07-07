import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, newId, parseBody } from "@/lib/api-utils";
import { toScheduleNote } from "@/lib/db-mappers";
import type { ScheduleNote } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await parseBody<Omit<ScheduleNote, "id">>(request);
  if (!body?.projectId || !body?.content) {
    return jsonError("필수 항목이 누락되었습니다", 400);
  }

  const row = await prisma.scheduleNote.create({
    data: {
      id: newId("sn"),
      projectId: body.projectId,
      date: body.date ?? null,
      content: body.content,
      sortOrder: body.sortOrder,
      isShared: body.isShared ?? false,
    },
  });

  return jsonOk(toScheduleNote(row), 201);
}

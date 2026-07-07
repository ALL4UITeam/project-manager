import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, newId, parseBody } from "@/lib/api-utils";
import { toCalendarMilestone } from "@/lib/db-mappers";
import type { CalendarMilestone } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await parseBody<Omit<CalendarMilestone, "id">>(request);
  if (!body?.title || !body?.date) {
    return jsonError("제목과 날짜가 필요합니다", 400);
  }

  const row = await prisma.calendarMilestone.create({
    data: {
      id: newId("m"),
      title: body.title,
      date: body.date,
      projectId: body.projectId ?? null,
      description: body.description ?? null,
      isShared: body.isShared,
      isTeamAdmin: body.isTeamAdmin ?? false,
    },
  });

  return jsonOk(toCalendarMilestone(row), 201);
}

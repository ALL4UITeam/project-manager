import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { toCalendarMilestone } from "@/lib/db-mappers";
import type { CalendarMilestone } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await parseBody<Partial<CalendarMilestone>>(request);
  if (!body) return jsonError("잘못된 요청", 400);

  try {
    const row = await prisma.calendarMilestone.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.date !== undefined ? { date: body.date } : {}),
        ...(body.projectId !== undefined ? { projectId: body.projectId ?? null } : {}),
        ...(body.description !== undefined ? { description: body.description ?? null } : {}),
        ...(body.isShared !== undefined ? { isShared: body.isShared } : {}),
        ...(body.isTeamAdmin !== undefined ? { isTeamAdmin: body.isTeamAdmin } : {}),
      },
    });
    return jsonOk(toCalendarMilestone(row));
  } catch {
    return jsonError("일정을 찾을 수 없습니다", 404);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await prisma.calendarMilestone.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonError("일정을 찾을 수 없습니다", 404);
  }
}

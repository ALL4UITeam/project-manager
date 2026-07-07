import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { toScheduleRow } from "@/lib/db-mappers";
import type { ScheduleRow } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await parseBody<Partial<ScheduleRow>>(request);
  if (!body) return jsonError("잘못된 요청", 400);

  try {
    const row = await prisma.scheduleRow.update({
      where: { id },
      data: {
        ...(body.service !== undefined ? { service: body.service } : {}),
        ...(body.part !== undefined ? { part: body.part } : {}),
        ...(body.taskName !== undefined ? { taskName: body.taskName } : {}),
        ...(body.startDate !== undefined ? { startDate: body.startDate } : {}),
        ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.remarks !== undefined ? { remarks: body.remarks ?? null } : {}),
      },
    });
    return jsonOk(toScheduleRow(row));
  } catch {
    return jsonError("일정 행을 찾을 수 없습니다", 404);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await prisma.scheduleRow.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonError("일정 행을 찾을 수 없습니다", 404);
  }
}

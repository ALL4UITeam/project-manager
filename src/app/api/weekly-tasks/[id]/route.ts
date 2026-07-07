import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { toWeeklyTask } from "@/lib/db-mappers";
import type { WeeklyTask } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await parseBody<Partial<WeeklyTask>>(request);
  if (!body) return jsonError("잘못된 요청", 400);

  try {
    const row = await prisma.weeklyTask.update({
      where: { id },
      data: {
        ...(body.projectId !== undefined ? { projectId: body.projectId } : {}),
        ...(body.userId !== undefined ? { userId: body.userId } : {}),
        ...(body.part !== undefined ? { part: body.part } : {}),
        ...(body.taskType !== undefined ? { taskType: body.taskType } : {}),
        ...(body.startDate !== undefined ? { startDate: body.startDate } : {}),
        ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.md !== undefined ? { md: body.md } : {}),
      },
    });
    return jsonOk(toWeeklyTask(row));
  } catch {
    return jsonError("업무를 찾을 수 없습니다", 404);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await prisma.weeklyTask.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonError("업무를 찾을 수 없습니다", 404);
  }
}

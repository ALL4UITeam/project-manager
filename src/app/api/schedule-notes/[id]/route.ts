import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { toScheduleNote } from "@/lib/db-mappers";
import type { ScheduleNote } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await parseBody<Partial<ScheduleNote>>(request);
  if (!body) return jsonError("잘못된 요청", 400);

  try {
    const row = await prisma.scheduleNote.update({
      where: { id },
      data: {
        ...(body.date !== undefined ? { date: body.date ?? null } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.isShared !== undefined ? { isShared: body.isShared } : {}),
      },
    });
    return jsonOk(toScheduleNote(row));
  } catch {
    return jsonError("비고를 찾을 수 없습니다", 404);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await prisma.scheduleNote.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonError("비고를 찾을 수 없습니다", 404);
  }
}

import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { toProjectRemark } from "@/lib/db-mappers";
import type { ProjectRemark } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await parseBody<
    Partial<Pick<ProjectRemark, "date" | "content" | "weekStart">>
  >(request);
  if (!body) return jsonError("잘못된 요청", 400);

  try {
    const row = await prisma.projectRemark.update({
      where: { id },
      data: {
        ...(body.date !== undefined ? { date: body.date } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.weekStart !== undefined ? { weekStart: body.weekStart } : {}),
      },
    });
    return jsonOk(toProjectRemark(row));
  } catch {
    return jsonError("비고를 찾을 수 없습니다", 404);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await prisma.projectRemark.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonError("비고를 찾을 수 없습니다", 404);
  }
}

import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { toProjectIssue } from "@/lib/db-mappers";
import type { ProjectIssue } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await parseBody<
    Partial<Pick<ProjectIssue, "status" | "content" | "weekStart">>
  >(request);
  if (!body) return jsonError("잘못된 요청", 400);

  try {
    const row = await prisma.projectIssue.update({
      where: { id },
      data: {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.weekStart !== undefined ? { weekStart: body.weekStart } : {}),
      },
    });
    return jsonOk(toProjectIssue(row));
  } catch {
    return jsonError("이슈를 찾을 수 없습니다", 404);
  }
}

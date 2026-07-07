import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { projectPartialToDb, toProject } from "@/lib/db-mappers";
import type { Project } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await parseBody<Partial<Project>>(request);
  if (!body) return jsonError("잘못된 요청", 400);

  try {
    const row = await prisma.project.update({
      where: { id },
      data: projectPartialToDb(body),
    });
    return jsonOk(toProject(row));
  } catch {
    return jsonError("프로젝트를 찾을 수 없습니다", 404);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await prisma.project.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonError("프로젝트를 찾을 수 없습니다", 404);
  }
}

import { prisma } from "@/lib/prisma";
import {
  jsonError,
  jsonOk,
  parseBody,
  prismaErrorMessage,
} from "@/lib/api-utils";
import { projectPartialToDb, toProject } from "@/lib/db-mappers";
import type { Project } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await parseBody<Partial<Project>>(request);
  if (!body) return jsonError("잘못된 요청", 400);

  if (body.code !== undefined) {
    const code = body.code.trim();
    if (!code) return jsonError("프로젝트 코드를 입력해 주세요.", 400);
    const duplicate = await prisma.project.findFirst({
      where: { code, NOT: { id } },
    });
    if (duplicate) {
      return jsonError("이미 사용 중인 프로젝트 코드입니다.", 409);
    }
    body.code = code;
  }

  try {
    const row = await prisma.project.update({
      where: { id },
      data: projectPartialToDb(body),
    });
    return jsonOk(toProject(row));
  } catch (error) {
    const message = prismaErrorMessage(error);
    if (message) return jsonError(message, 409);
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

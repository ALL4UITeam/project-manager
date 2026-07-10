import { prisma } from "@/lib/prisma";
import {
  jsonError,
  jsonOk,
  newId,
  parseBody,
  prismaErrorMessage,
} from "@/lib/api-utils";
import { projectToDb, toProject } from "@/lib/db-mappers";
import type { Project } from "@/types";
import { normalizeAllocatedMd } from "@/lib/project-md-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await parseBody<Omit<Project, "id">>(request);
  if (!body?.code?.trim() || !body?.name?.trim()) {
    return jsonError("코드와 프로젝트명이 필요합니다", 400);
  }

  const code = body.code.trim();
  const existing = await prisma.project.findUnique({ where: { code } });
  if (existing) {
    return jsonError("이미 사용 중인 프로젝트 코드입니다.", 409);
  }

  const allocatedMd = normalizeAllocatedMd(body.allocatedMd);
  try {
    const row = await prisma.project.create({
      data: {
        id: newId("p"),
        ...projectToDb({ ...body, code, allocatedMd }),
      },
    });
    return jsonOk(toProject(row), 201);
  } catch (error) {
    const message = prismaErrorMessage(error);
    if (message) return jsonError(message, 409);
    throw error;
  }
}

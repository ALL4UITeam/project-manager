import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, newId, parseBody } from "@/lib/api-utils";
import { projectToDb, toProject } from "@/lib/db-mappers";
import type { Project } from "@/types";
import { normalizeAllocatedMd } from "@/lib/project-md-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await parseBody<Omit<Project, "id">>(request);
  if (!body?.code || !body?.name) {
    return jsonError("코드와 프로젝트명이 필요합니다", 400);
  }

  const allocatedMd = normalizeAllocatedMd(body.allocatedMd);
  const row = await prisma.project.create({
    data: {
      id: newId("p"),
      ...projectToDb({ ...body, allocatedMd }),
    },
  });

  return jsonOk(toProject(row), 201);
}

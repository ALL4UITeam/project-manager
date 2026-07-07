import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, newId, parseBody } from "@/lib/api-utils";
import { toProjectRemark } from "@/lib/db-mappers";
import type { ProjectRemark } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await parseBody<Omit<ProjectRemark, "id" | "userId"> & { userId: string }>(
    request
  );
  if (!body?.projectId || !body?.userId || !body?.content) {
    return jsonError("필수 항목이 누락되었습니다", 400);
  }

  const row = await prisma.projectRemark.create({
    data: {
      id: newId("r"),
      projectId: body.projectId,
      userId: body.userId,
      date: body.date,
      weekStart: body.weekStart,
      content: body.content,
    },
  });

  return jsonOk(toProjectRemark(row), 201);
}

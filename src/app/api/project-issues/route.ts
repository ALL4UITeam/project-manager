import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, newId, parseBody } from "@/lib/api-utils";
import { toProjectIssue } from "@/lib/db-mappers";
import { getWeekStartFromDate } from "@/lib/week-utils";
import type { ProjectIssue } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await parseBody<{
    projectId: string;
    userId: string;
    date: string;
    content: string;
    status?: ProjectIssue["status"];
  }>(request);

  if (!body?.projectId || !body?.userId || !body?.date || !body?.content) {
    return jsonError("필수 항목이 누락되었습니다", 400);
  }

  const row = await prisma.projectIssue.create({
    data: {
      id: newId("i"),
      projectId: body.projectId,
      userId: body.userId,
      date: body.date,
      weekStart: getWeekStartFromDate(body.date),
      content: body.content,
      status: body.status ?? "진행",
    },
  });

  return jsonOk(toProjectIssue(row), 201);
}

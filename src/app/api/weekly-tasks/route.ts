import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, newId, parseBody } from "@/lib/api-utils";
import { toWeeklyTask } from "@/lib/db-mappers";
import type { WeeklyTask } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await parseBody<Omit<WeeklyTask, "id">>(request);
  if (!body?.projectId || !body?.userId) {
    return jsonError("필수 항목이 누락되었습니다", 400);
  }

  const row = await prisma.weeklyTask.create({
    data: {
      id: newId("t"),
      projectId: body.projectId,
      userId: body.userId,
      part: body.part,
      taskType: body.taskType,
      startDate: body.startDate,
      endDate: body.endDate,
      status: body.status,
      content: body.content,
      md: body.md,
    },
  });

  return jsonOk(toWeeklyTask(row), 201);
}

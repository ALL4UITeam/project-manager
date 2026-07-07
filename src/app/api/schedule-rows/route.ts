import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, newId, parseBody } from "@/lib/api-utils";
import { toScheduleRow } from "@/lib/db-mappers";
import type { ScheduleRow } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await parseBody<Omit<ScheduleRow, "id">>(request);
  if (!body?.projectId || !body?.taskName) {
    return jsonError("필수 항목이 누락되었습니다", 400);
  }

  const row = await prisma.scheduleRow.create({
    data: {
      id: newId("sr"),
      projectId: body.projectId,
      service: body.service,
      part: body.part,
      taskName: body.taskName,
      startDate: body.startDate,
      endDate: body.endDate,
      sortOrder: body.sortOrder,
      remarks: body.remarks ?? null,
    },
  });

  return jsonOk(toScheduleRow(row), 201);
}

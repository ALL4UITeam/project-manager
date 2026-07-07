import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { toScheduleRow } from "@/lib/db-mappers";
import { buildRowsFromTemplate, type ScheduleTemplateId } from "@/lib/schedule-templates";
import { newId } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await parseBody<{
    projectId: string;
    templateId: ScheduleTemplateId;
    anchorDate: string;
  }>(request);

  if (!body?.projectId || !body?.templateId || !body?.anchorDate) {
    return jsonError("필수 항목이 누락되었습니다", 400);
  }

  const existing = await prisma.scheduleRow.findMany({
    where: { projectId: body.projectId },
    select: { sortOrder: true },
  });
  const maxOrder = existing.reduce((max, r) => Math.max(max, r.sortOrder), -1);

  const templateRows = buildRowsFromTemplate(
    body.projectId,
    body.templateId,
    body.anchorDate,
    maxOrder + 1
  );

  const created = await prisma.$transaction(
    templateRows.map((row, index) =>
      prisma.scheduleRow.create({
        data: {
          id: newId(`sr-${index}`),
          projectId: row.projectId,
          service: row.service,
          part: row.part,
          taskName: row.taskName,
          startDate: row.startDate,
          endDate: row.endDate,
          sortOrder: row.sortOrder,
          remarks: row.remarks ?? null,
        },
      })
    )
  );

  return jsonOk(created.map(toScheduleRow), 201);
}

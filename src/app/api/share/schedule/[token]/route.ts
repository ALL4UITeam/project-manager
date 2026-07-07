import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-utils";
import { toProject, toScheduleRow } from "@/lib/db-mappers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const project = await prisma.project.findFirst({
    where: { scheduleShareToken: token, scheduleLinkShareEnabled: true },
  });
  if (!project) return jsonError("일정표를 찾을 수 없습니다", 404);

  const rows = await prisma.scheduleRow.findMany({
    where: { projectId: project.id },
    orderBy: { sortOrder: "asc" },
  });

  return jsonOk({
    project: toProject(project),
    scheduleRows: rows.map(toScheduleRow),
  });
}

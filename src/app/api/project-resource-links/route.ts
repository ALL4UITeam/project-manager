import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, newId, parseBody } from "@/lib/api-utils";
import { toProjectResourceLink } from "@/lib/db-mappers";
import type { ProjectResourceLink } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await parseBody<Omit<ProjectResourceLink, "id" | "userId"> & { userId: string }>(
    request
  );
  if (!body?.projectId || !body?.userId || !body?.label || !body?.url) {
    return jsonError("필수 항목이 누락되었습니다", 400);
  }

  const row = await prisma.projectResourceLink.create({
    data: {
      id: newId("lnk"),
      projectId: body.projectId,
      part: body.part,
      label: body.label,
      url: body.url,
      userId: body.userId,
    },
  });

  return jsonOk(toProjectResourceLink(row), 201);
}

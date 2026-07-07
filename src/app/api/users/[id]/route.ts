import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { toUser } from "@/lib/db-mappers";
import type { UserPart, UserRole } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await parseBody<{ role?: UserRole; part?: UserPart }>(request);
  if (!body) return jsonError("잘못된 요청", 400);

  try {
    const row = await prisma.user.update({
      where: { id },
      data: {
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.part !== undefined ? { part: body.part } : {}),
      },
    });
    return jsonOk(toUser(row));
  } catch {
    return jsonError("사용자를 찾을 수 없습니다", 404);
  }
}

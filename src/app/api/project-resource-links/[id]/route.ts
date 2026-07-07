import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await prisma.projectResourceLink.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonError("링크를 찾을 수 없습니다", 404);
  }
}

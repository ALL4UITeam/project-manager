import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { toUser } from "@/lib/db-mappers";
import type { UserPart, UserRole } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

type UpdateUserBody = {
  role?: UserRole;
  part?: UserPart;
  name?: string;
  email?: string;
  password?: string;
};

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await parseBody<UpdateUserBody>(request);
  if (!body) return jsonError("잘못된 요청", 400);

  if (body.email) {
    const duplicate = await prisma.user.findFirst({
      where: { email: body.email, NOT: { id } },
    });
    if (duplicate) return jsonError("이미 사용 중인 이메일입니다", 409);
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.email !== undefined) data.email = body.email.trim();
  if (body.role !== undefined) data.role = body.role;
  if (body.part !== undefined) data.part = body.part;
  if (body.password !== undefined && body.password.length > 0) {
    data.password = body.password;
  }

  if (Object.keys(data).length === 0) {
    return jsonError("변경할 항목이 없습니다", 400);
  }

  try {
    const row = await prisma.user.update({
      where: { id },
      data,
    });
    return jsonOk(toUser(row));
  } catch {
    return jsonError("사용자를 찾을 수 없습니다", 404);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return jsonError("사용자를 찾을 수 없습니다", 404);

  if (user.role === "MASTER") {
    const masterCount = await prisma.user.count({ where: { role: "MASTER" } });
    if (masterCount <= 1) {
      return jsonError("마지막 Master 계정은 삭제할 수 없습니다", 400);
    }
  }

  try {
    await prisma.user.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return jsonError(
        "이 계정에 연결된 업무·이슈·회의록이 있어 삭제할 수 없습니다",
        409
      );
    }
    return jsonError("사용자를 삭제할 수 없습니다", 500);
  }
}

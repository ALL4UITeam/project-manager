import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { toUser } from "@/lib/db-mappers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await parseBody<{ email?: string; password?: string }>(request);
  if (!body?.email || !body?.password) {
    return jsonError("이메일과 비밀번호가 필요합니다", 400);
  }

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || user.password !== body.password) {
    return jsonError("이메일 또는 비밀번호가 올바르지 않습니다", 401);
  }

  return jsonOk({ user: toUser(user) });
}

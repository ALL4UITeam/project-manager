import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, newId, parseBody } from "@/lib/api-utils";
import { toUser } from "@/lib/db-mappers";
import type { User } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await parseBody<Omit<User, "id">>(request);
  if (!body?.email || !body?.password || !body?.name) {
    return jsonError("필수 항목이 누락되었습니다", 400);
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) return jsonError("이미 사용 중인 이메일입니다", 409);

  const row = await prisma.user.create({
    data: {
      id: newId("u"),
      name: body.name,
      email: body.email,
      role: body.role,
      part: body.part,
      password: body.password,
    },
  });

  return jsonOk(toUser(row), 201);
}

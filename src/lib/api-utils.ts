import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function prismaErrorMessage(error: unknown): string | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;
  if (error.code === "P2002") {
    const fields = error.meta?.target;
    if (Array.isArray(fields) && fields.includes("code")) {
      return "이미 사용 중인 프로젝트 코드입니다.";
    }
    return "이미 등록된 값이 있습니다.";
  }
  return null;
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function parseBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

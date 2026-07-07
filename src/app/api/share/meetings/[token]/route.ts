import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-utils";
import { toMeetingNote, toProject } from "@/lib/db-mappers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const note = await prisma.meetingNote.findFirst({
    where: { shareToken: token, linkShareEnabled: true },
  });
  if (!note) return jsonError("회의록을 찾을 수 없습니다", 404);

  const project = await prisma.project.findUnique({ where: { id: note.projectId } });

  return jsonOk({
    note: toMeetingNote(note),
    project: project ? toProject(project) : null,
  });
}

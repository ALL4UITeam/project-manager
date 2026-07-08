import { PrismaClient } from "@prisma/client";
import {
  mockUsers,
  mockProjects,
  mockWeeklyTasks,
  mockProjectIssues,
  mockProjectRemarks,
  mockProjectResourceLinks,
  mockMilestones,
  mockMeetingNotes,
} from "../src/data/mock-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.meetingNote.deleteMany();
  await prisma.scheduleNote.deleteMany();
  await prisma.scheduleRow.deleteMany();
  await prisma.calendarMilestone.deleteMany();
  await prisma.projectResourceLink.deleteMany();
  await prisma.projectRemark.deleteMany();
  await prisma.projectIssue.deleteMany();
  await prisma.weeklyTask.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: mockUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      part: u.part,
      password: u.password,
    })),
  });

  await prisma.project.createMany({
    data: mockProjects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      pmName: p.pmName,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      assigneePrimary: p.assigneePrimary,
      assigneeSecondary: p.assigneeSecondary ?? null,
      scheduleShareToken: p.scheduleShareToken ?? null,
      scheduleLinkShareEnabled: p.scheduleLinkShareEnabled ?? false,
      allocatedMdPlanning: p.allocatedMd.기획,
      allocatedMdDesign: p.allocatedMd.디자인,
      allocatedMdPublishing: p.allocatedMd.퍼블리싱,
      allocatedMdOther: p.allocatedMd.기타,
    })),
  });

  if (mockWeeklyTasks.length) {
    await prisma.weeklyTask.createMany({
      data: mockWeeklyTasks.map((t) => ({
        id: t.id,
        projectId: t.projectId,
        userId: t.userId,
        part: t.part,
        taskType: t.taskType,
        startDate: t.startDate,
        endDate: t.endDate,
        status: t.status,
        content: t.content,
        md: t.md,
      })),
    });
  }

  if (mockProjectIssues.length) {
    await prisma.projectIssue.createMany({
      data: mockProjectIssues.map((i) => ({
        id: i.id,
        projectId: i.projectId,
        userId: i.userId,
        date: i.date,
        weekStart: i.weekStart,
        content: i.content,
        status: i.status,
      })),
    });
  }

  if (mockProjectRemarks.length) {
    await prisma.projectRemark.createMany({
      data: mockProjectRemarks.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        userId: r.userId,
        date: r.date,
        weekStart: r.weekStart,
        content: r.content,
      })),
    });
  }

  if (mockProjectResourceLinks.length) {
    await prisma.projectResourceLink.createMany({
      data: mockProjectResourceLinks.map((l) => ({
        id: l.id,
        projectId: l.projectId,
        part: l.part,
        label: l.label,
        url: l.url,
        userId: l.userId,
      })),
    });
  }

  if (mockMilestones.length) {
    await prisma.calendarMilestone.createMany({
      data: mockMilestones.map((m) => ({
        id: m.id,
        title: m.title,
        date: m.date,
        projectId: m.projectId ?? null,
        description: m.description ?? null,
        isShared: m.isShared,
        isTeamAdmin: m.isTeamAdmin ?? false,
      })),
    });
  }

  if (mockMeetingNotes.length) {
    await prisma.meetingNote.createMany({
      data: mockMeetingNotes.map((n) => ({
        id: n.id,
        projectId: n.projectId,
        title: n.title,
        date: n.date,
        meetingTime: n.meetingTime,
        authorName: n.authorName,
        location: n.location,
        participants: n.participants,
        content: n.content,
        authorId: n.authorId,
        shareToken: n.shareToken,
        linkShareEnabled: n.linkShareEnabled,
      })),
    });
  }

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.weeklyTask.count(),
  ]);
  console.log(`Seed 완료 — users: ${counts[0]}, projects: ${counts[1]}, tasks: ${counts[2]}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

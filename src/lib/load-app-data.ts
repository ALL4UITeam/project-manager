import { prisma } from "@/lib/prisma";
import {
  toUser,
  toProject,
  toWeeklyTask,
  toProjectIssue,
  toProjectRemark,
  toProjectResourceLink,
  toCalendarMilestone,
  toScheduleRow,
  toScheduleNote,
  toMeetingNote,
  type AppDataPayload,
} from "@/lib/db-mappers";

export async function loadAppData(): Promise<AppDataPayload> {
  const [
    users,
    projects,
    weeklyTasks,
    milestones,
    meetingNotes,
    projectIssues,
    projectRemarks,
    projectResourceLinks,
    scheduleRows,
    scheduleNotes,
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany({ orderBy: { code: "asc" } }),
    prisma.weeklyTask.findMany(),
    prisma.calendarMilestone.findMany({ orderBy: { date: "asc" } }),
    prisma.meetingNote.findMany({ orderBy: { date: "desc" } }),
    prisma.projectIssue.findMany(),
    prisma.projectRemark.findMany(),
    prisma.projectResourceLink.findMany(),
    prisma.scheduleRow.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.scheduleNote.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return {
    users: users.map((u) => toUser(u)),
    projects: projects.map(toProject),
    weeklyTasks: weeklyTasks.map(toWeeklyTask),
    milestones: milestones.map(toCalendarMilestone),
    meetingNotes: meetingNotes.map(toMeetingNote),
    projectIssues: projectIssues.map(toProjectIssue),
    projectRemarks: projectRemarks.map(toProjectRemark),
    projectResourceLinks: projectResourceLinks.map(toProjectResourceLink),
    scheduleRows: scheduleRows.map(toScheduleRow),
    scheduleNotes: scheduleNotes.map(toScheduleNote),
  };
}

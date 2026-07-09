import type {
  User as DbUser,
  Project as DbProject,
  WeeklyTask as DbWeeklyTask,
  ProjectIssue as DbIssue,
  ProjectRemark as DbRemark,
  ProjectResourceLink as DbLink,
  CalendarMilestone as DbMilestone,
  ScheduleRow as DbScheduleRow,
  ScheduleNote as DbScheduleNote,
  MeetingNote as DbMeetingNote,
} from "@prisma/client";
import type {
  User,
  Project,
  WeeklyTask,
  ProjectIssue,
  ProjectRemark,
  ProjectResourceLink,
  CalendarMilestone,
  ScheduleRow,
  ScheduleNote,
  MeetingNote,
} from "@/types";

function dec(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : Number(value);
}

export function toUser(row: DbUser, includePassword = false): User {
  const user: User = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    part: row.part,
    password: "",
  };
  if (includePassword) user.password = row.password;
  return user;
}

export function toProject(row: DbProject): Project {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    pmName: row.pmName,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status as Project["status"],
    assigneePrimary: row.assigneePrimary,
    assigneeSecondary: row.assigneeSecondary ?? undefined,
    scheduleShareToken: row.scheduleShareToken ?? undefined,
    scheduleLinkShareEnabled: row.scheduleLinkShareEnabled,
    isSupportProject: row.isSupportProject,
    allocatedMd: {
      기획: dec(row.allocatedMdPlanning),
      디자인: dec(row.allocatedMdDesign),
      퍼블리싱: dec(row.allocatedMdPublishing),
      기타: dec(row.allocatedMdOther),
    },
  };
}

export function toWeeklyTask(row: DbWeeklyTask): WeeklyTask {
  return {
    id: row.id,
    projectId: row.projectId,
    userId: row.userId,
    part: row.part as WeeklyTask["part"],
    taskType: row.taskType as WeeklyTask["taskType"],
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status as WeeklyTask["status"],
    content: row.content,
    md: dec(row.md),
  };
}

export function toProjectIssue(row: DbIssue): ProjectIssue {
  return {
    id: row.id,
    projectId: row.projectId,
    userId: row.userId,
    date: row.date,
    weekStart: row.weekStart,
    content: row.content,
    status: row.status as ProjectIssue["status"],
  };
}

export function toProjectRemark(row: DbRemark): ProjectRemark {
  return {
    id: row.id,
    projectId: row.projectId,
    userId: row.userId,
    date: row.date,
    weekStart: row.weekStart,
    content: row.content,
  };
}

export function toProjectResourceLink(row: DbLink): ProjectResourceLink {
  return {
    id: row.id,
    projectId: row.projectId,
    part: row.part as ProjectResourceLink["part"],
    label: row.label,
    url: row.url,
    userId: row.userId,
  };
}

export function toCalendarMilestone(row: DbMilestone): CalendarMilestone {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    projectId: row.projectId ?? undefined,
    description: row.description ?? undefined,
    isShared: row.isShared,
    isTeamAdmin: row.isTeamAdmin,
  };
}

export function toScheduleRow(row: DbScheduleRow): ScheduleRow {
  return {
    id: row.id,
    projectId: row.projectId,
    service: row.service,
    part: row.part as ScheduleRow["part"],
    taskName: row.taskName,
    startDate: row.startDate,
    endDate: row.endDate,
    sortOrder: row.sortOrder,
    remarks: row.remarks ?? undefined,
  };
}

export function toScheduleNote(row: DbScheduleNote): ScheduleNote {
  return {
    id: row.id,
    projectId: row.projectId,
    date: row.date ?? undefined,
    content: row.content,
    sortOrder: row.sortOrder,
    isShared: row.isShared,
  };
}

export function toMeetingNote(row: DbMeetingNote): MeetingNote {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    date: row.date,
    meetingTime: row.meetingTime,
    authorName: row.authorName,
    location: row.location,
    participants: row.participants,
    content: row.content,
    authorId: row.authorId,
    shareToken: row.shareToken,
    linkShareEnabled: row.linkShareEnabled,
  };
}

export interface AppDataPayload {
  users: User[];
  projects: Project[];
  weeklyTasks: WeeklyTask[];
  milestones: CalendarMilestone[];
  meetingNotes: MeetingNote[];
  projectIssues: ProjectIssue[];
  projectRemarks: ProjectRemark[];
  projectResourceLinks: ProjectResourceLink[];
  scheduleRows: ScheduleRow[];
  scheduleNotes: ScheduleNote[];
}

export function projectToDb(data: Omit<Project, "id">) {
  return {
    code: data.code,
    name: data.name,
    pmName: data.pmName,
    startDate: data.startDate,
    endDate: data.endDate,
    status: data.status,
    assigneePrimary: data.assigneePrimary,
    assigneeSecondary: data.assigneeSecondary ?? null,
    scheduleShareToken: data.scheduleShareToken ?? null,
    scheduleLinkShareEnabled: data.scheduleLinkShareEnabled ?? false,
    isSupportProject: data.isSupportProject ?? false,
    allocatedMdPlanning: data.allocatedMd.기획,
    allocatedMdDesign: data.allocatedMd.디자인,
    allocatedMdPublishing: data.allocatedMd.퍼블리싱,
    allocatedMdOther: data.allocatedMd.기타,
  };
}

export function projectPartialToDb(data: Partial<Project>) {
  const out: Record<string, unknown> = {};
  if (data.code !== undefined) out.code = data.code;
  if (data.name !== undefined) out.name = data.name;
  if (data.pmName !== undefined) out.pmName = data.pmName;
  if (data.startDate !== undefined) out.startDate = data.startDate;
  if (data.endDate !== undefined) out.endDate = data.endDate;
  if (data.status !== undefined) out.status = data.status;
  if (data.assigneePrimary !== undefined) out.assigneePrimary = data.assigneePrimary;
  if (data.assigneeSecondary !== undefined)
    out.assigneeSecondary = data.assigneeSecondary ?? null;
  if (data.scheduleShareToken !== undefined)
    out.scheduleShareToken = data.scheduleShareToken ?? null;
  if (data.scheduleLinkShareEnabled !== undefined)
    out.scheduleLinkShareEnabled = data.scheduleLinkShareEnabled;
  if (data.isSupportProject !== undefined)
    out.isSupportProject = data.isSupportProject;
  if (data.allocatedMd !== undefined) {
    out.allocatedMdPlanning = data.allocatedMd.기획;
    out.allocatedMdDesign = data.allocatedMd.디자인;
    out.allocatedMdPublishing = data.allocatedMd.퍼블리싱;
    out.allocatedMdOther = data.allocatedMd.기타;
  }
  return out;
}

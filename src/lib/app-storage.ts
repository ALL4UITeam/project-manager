import type {
  User,
  Project,
  WeeklyTask,
  CalendarMilestone,
  MeetingNote,
  ProjectIssue,
  ProjectRemark,
  ProjectResourceLink,
  ScheduleRow,
  ScheduleNote,
} from "@/types";
import {
  mockScheduleRows,
  mockScheduleNotes,
} from "@/data/mock-schedule";
import { normalizeProjectMdFields } from "@/lib/project-md-utils";
import { normalizeMeetingNote } from "@/lib/meeting-note-utils";
import {
  alignProjectIssuesToCurrentWeek,
  alignProjectRemarksToCurrentWeek,
  alignWeeklyTasksToCurrentWeek,
} from "@/lib/demo-week-align";

const STORAGE_KEY = "a4-app-snapshot";
const STORAGE_VERSION = 6;

export interface AppSnapshot {
  version: number;
  currentUserId: string | null;
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

function hasCoreArrays(snapshot: Partial<AppSnapshot>): boolean {
  return (
    Array.isArray(snapshot.users) &&
    Array.isArray(snapshot.projects) &&
    Array.isArray(snapshot.weeklyTasks) &&
    Array.isArray(snapshot.milestones) &&
    Array.isArray(snapshot.meetingNotes) &&
    Array.isArray(snapshot.projectIssues) &&
    Array.isArray(snapshot.projectRemarks) &&
    Array.isArray(snapshot.projectResourceLinks) &&
    (snapshot.currentUserId === null ||
      snapshot.currentUserId === undefined ||
      typeof snapshot.currentUserId === "string")
  );
}

function normalizeSnapshot(raw: unknown): AppSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const snapshot = raw as Partial<AppSnapshot> & { version?: number };
  if (snapshot.version !== 1 && snapshot.version !== 2 && snapshot.version !== 3 && snapshot.version !== 4 && snapshot.version !== 5 && snapshot.version !== 6)
    return null;
  if (!hasCoreArrays(snapshot)) return null;

  const projectIssues = (snapshot.projectIssues ?? []).map((issue) => ({
    ...issue,
    status: issue.status ?? "진행",
  }));

  const projectResourceLinks = (snapshot.projectResourceLinks ?? []).map(
    (link) => ({
      ...link,
      userId: link.userId ?? "u-kim",
    })
  );

  const meetingNotes = (snapshot.meetingNotes ?? []).map((note) =>
    normalizeMeetingNote(note as MeetingNote, (id) =>
      snapshot.users?.find((u) => u.id === id)
    )
  );

  return {
    version: STORAGE_VERSION,
    currentUserId: snapshot.currentUserId ?? null,
    users: snapshot.users!,
    projects: snapshot.projects!.map((p) => normalizeProjectMdFields(p)),
    weeklyTasks: alignWeeklyTasksToCurrentWeek(snapshot.weeklyTasks!),
    milestones: snapshot.milestones!,
    meetingNotes,
    projectIssues: alignProjectIssuesToCurrentWeek(projectIssues),
    projectRemarks: alignProjectRemarksToCurrentWeek(snapshot.projectRemarks!),
    projectResourceLinks,
    scheduleRows: Array.isArray(snapshot.scheduleRows)
      ? snapshot.scheduleRows
      : mockScheduleRows,
    scheduleNotes: Array.isArray(snapshot.scheduleNotes)
      ? snapshot.scheduleNotes
      : mockScheduleNotes,
  };
}

export function loadAppSnapshot(): AppSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return normalizeSnapshot(parsed);
  } catch {
    return null;
  }
}

export function saveAppSnapshot(snapshot: Omit<AppSnapshot, "version">): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...snapshot, version: STORAGE_VERSION })
    );
  } catch {
    // quota exceeded or private browsing — ignore
  }
}

export type UserRole = "MASTER" | "LEADER" | "MEMBER" | "EXTERNAL";

export type UserPart = "PLANNING" | "DESIGN" | "PUBLISHING" | "DEV";

export type ProjectStatus = "완료" | "진행" | "홀드";

export type TaskType = "THIS_WEEK" | "NEXT_WEEK";

export type TaskStatus = "완료" | "진행";

export type WorkPart = "기획" | "디자인" | "퍼블리싱";

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  part: UserPart;
  password: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  pmName: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  /** 담당 정 */
  assigneePrimary: string;
  /** 담당 부 (없으면 표시하지 않음) */
  assigneeSecondary?: string;
}

export interface ProjectIssue {
  id: string;
  projectId: string;
  userId: string;
  date: string;
  weekStart: string;
  content: string;
}

/** 이슈와 별도 — 일정·참고 등 비고 (예: 2026/06/01 디자인 시안 확인) */
export interface ProjectRemark {
  id: string;
  projectId: string;
  userId: string;
  date: string;
  weekStart: string;
  content: string;
}

/** 파트별 산출물 링크 (예: 디자인 시안1, 기획 IA 문서) */
export interface ProjectResourceLink {
  id: string;
  projectId: string;
  part: WorkPart;
  label: string;
  url: string;
}

export interface WeeklyTask {
  id: string;
  projectId: string;
  userId: string;
  part: WorkPart;
  taskType: TaskType;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  content: string;
  md: number;
}

export interface CalendarMilestone {
  id: string;
  title: string;
  date: string;
  projectId?: string;
  description?: string;
  isShared: boolean;
  /** UI팀 관리 일정(연차·팀 일정) — 보라색 표시 */
  isTeamAdmin?: boolean;
}

export interface MeetingNote {
  id: string;
  projectId: string;
  title: string;
  date: string;
  /** Tiptap HTML */
  content: string;
  authorId: string;
  /** 링크 공유용 고유 토큰 */
  shareToken: string;
  /** 링크를 가진 누구나 조회 (계정 불필요) */
  linkShareEnabled: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  MASTER: "Master",
  LEADER: "팀장",
  MEMBER: "팀원",
  EXTERNAL: "외부",
};

export const PART_LABELS: Record<UserPart, string> = {
  PLANNING: "기획",
  DESIGN: "디자인",
  PUBLISHING: "퍼블리싱",
  DEV: "개발",
};

export const WORK_PARTS: WorkPart[] = ["기획", "디자인", "퍼블리싱"];

export const USER_PART_TO_WORK: Record<UserPart, WorkPart | null> = {
  PLANNING: "기획",
  DESIGN: "디자인",
  PUBLISHING: "퍼블리싱",
  DEV: null,
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  완료: "완료",
  진행: "진행",
  홀드: "홀드",
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  THIS_WEEK: "이번주 실적",
  NEXT_WEEK: "다음주 계획",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  완료: "완료",
  진행: "진행",
};

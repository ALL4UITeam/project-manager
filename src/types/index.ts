export type UserRole = "MASTER" | "LEADER" | "MEMBER" | "EXTERNAL";

export type UserPart = "PLANNING" | "DESIGN" | "PUBLISHING" | "DEV";

export type ProjectStatus = "완료" | "진행" | "홀드";

export type TaskType = "THIS_WEEK" | "NEXT_WEEK";

/** 주간 보고 탭 — 저번주 실적은 조회 전용 */
export type ReportTaskView = TaskType | "LAST_WEEK";

export type TaskStatus = "완료" | "진행";

export type IssueStatus = "완료" | "진행";

export type WorkPart = "기획" | "디자인" | "퍼블리싱";

/** 프로젝트 수주(배정) M/D — 파트별 */
export type AllocatedMdPart = "기획" | "디자인" | "퍼블리싱" | "기타";

export interface ProjectAllocatedMd {
  기획: number;
  디자인: number;
  퍼블리싱: number;
  기타: number;
}

export const ALLOCATED_MD_PARTS: AllocatedMdPart[] = [
  "기획",
  "디자인",
  "퍼블리싱",
  "기타",
];

export const DEFAULT_ALLOCATED_MD: ProjectAllocatedMd = {
  기획: 0,
  디자인: 0,
  퍼블리싱: 0,
  기타: 0,
};

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
  /** 프로젝트 일정표 링크 공유 토큰 */
  scheduleShareToken?: string;
  /** 링크 공유 활성화 — 프로젝트 WBS 일정표 전체 */
  scheduleLinkShareEnabled?: boolean;
  /** 파트별 수주(배정) M/D */
  allocatedMd: ProjectAllocatedMd;
}

export interface ProjectIssue {
  id: string;
  projectId: string;
  userId: string;
  date: string;
  weekStart: string;
  content: string;
  status: IssueStatus;
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
  userId: string;
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

/** 프로젝트 WBS 간트 일정 행 (서비스 → 파트 → 상세업무) */
export interface ScheduleRow {
  id: string;
  projectId: string;
  /** 서비스 구분 (예: Mobile, PC Web) */
  service: string;
  part: WorkPart;
  taskName: string;
  startDate: string;
  endDate: string;
  sortOrder: number;
  /** 행 단위 비고 (간트 우측 열) */
  remarks?: string;
}

/** 프로젝트 일정표 하단·우측 마일스톤 비고 */
export interface ScheduleNote {
  id: string;
  projectId: string;
  date?: string;
  content: string;
  sortOrder: number;
  isShared?: boolean;
}

export const PART_GANTT_COLORS: Record<WorkPart, string> = {
  기획: "#facc15",
  디자인: "#4ade80",
  퍼블리싱: "#60a5fa",
};

export const PART_GANTT_BG: Record<WorkPart, string> = {
  기획: "bg-yellow-400",
  디자인: "bg-emerald-400",
  퍼블리싱: "bg-sky-400",
};

export const PART_GANTT_ROW_BG: Record<WorkPart, string> = {
  기획: "bg-yellow-50/80",
  디자인: "bg-emerald-50/80",
  퍼블리싱: "bg-sky-50/80",
};

export const PART_GANTT_TEXT: Record<WorkPart, string> = {
  기획: "text-yellow-900",
  디자인: "text-emerald-900",
  퍼블리싱: "text-sky-900",
};

export interface MeetingNote {
  id: string;
  projectId: string;
  /** 회의주제 */
  title: string;
  /** YYYY-MM-DD — 연도 필터용 */
  date: string;
  /** HH:mm — 회의 시각 */
  meetingTime: string;
  /** 작성자 표시명 (예: 김찬기 과장) */
  authorName: string;
  /** 회의장소 */
  location: string;
  /** 참석자 (팀별 줄바꿈 가능) */
  participants: string;
  /** 안건 및 협의내용 — Tiptap HTML */
  content: string;
  authorId: string;
  shareToken: string;
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

/** 계정 목록·발급 폼 파트 순서 */
export const USER_PARTS_ORDERED: UserPart[] = [
  "PLANNING",
  "DESIGN",
  "PUBLISHING",
  "DEV",
];

/** 권한 선택 순서 — 외부 협력은 맨 아래 */
export const USER_ROLES_ORDERED: UserRole[] = [
  "MASTER",
  "LEADER",
  "MEMBER",
  "EXTERNAL",
];

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

export const REPORT_TASK_VIEW_LABELS: Record<ReportTaskView, string> = {
  THIS_WEEK: "이번주 실적",
  LAST_WEEK: "저번주 실적",
  NEXT_WEEK: "다음주 계획",
};

export const REPORT_TASK_VIEWS: ReportTaskView[] = [
  "LAST_WEEK",
  "THIS_WEEK",
  "NEXT_WEEK",
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  완료: "완료",
  진행: "진행",
};

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  완료: "완료",
  진행: "진행",
};

import type { Project, ProjectStatus, WeeklyTask } from "@/types";

const STATUS_ORDER: Record<ProjectStatus, number> = {
  진행: 0,
  홀드: 1,
  완료: 2,
};

export type ProjectSortKey = "code" | "name" | "status" | "startDate";
export type ProjectSortDir = "asc" | "desc";
/** all | active(진행+홀드) | progress | hold | done */
export type ProjectStatusFilter =
  | "all"
  | "active"
  | "progress"
  | "hold"
  | "done";

/** AF_P01, AF_P12 등 코드 자연 정렬 */
export function compareProjectCode(a: string, b: string): number {
  const parse = (code: string) => {
    const m = code.trim().match(/^([A-Za-z_]+)(\d+)?(.*)$/);
    if (!m) return { prefix: code.toLowerCase(), num: 0, rest: "" };
    return {
      prefix: (m[1] ?? "").toLowerCase(),
      num: m[2] ? parseInt(m[2], 10) : 0,
      rest: (m[3] ?? "").toLowerCase(),
    };
  };
  const pa = parse(a);
  const pb = parse(b);
  if (pa.prefix !== pb.prefix) return pa.prefix.localeCompare(pb.prefix);
  if (pa.num !== pb.num) return pa.num - pb.num;
  return pa.rest.localeCompare(pb.rest);
}

export function sortProjects(
  projects: Project[],
  key: ProjectSortKey = "code",
  dir: ProjectSortDir = "asc"
): Project[] {
  const mul = dir === "asc" ? 1 : -1;
  return [...projects].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "code":
        cmp = compareProjectCode(a.code, b.code);
        break;
      case "name":
        cmp = a.name.localeCompare(b.name, "ko");
        break;
      case "status":
        cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (cmp === 0) cmp = compareProjectCode(a.code, b.code);
        break;
      case "startDate":
        cmp = a.startDate.localeCompare(b.startDate);
        break;
    }
    return cmp * mul;
  });
}

export function filterProjectsByStatus(
  projects: Project[],
  filter: ProjectStatusFilter
): Project[] {
  if (filter === "active") {
    return projects.filter((p) => p.status !== "완료");
  }
  if (filter === "progress") {
    return projects.filter((p) => p.status === "진행");
  }
  if (filter === "hold") {
    return projects.filter((p) => p.status === "홀드");
  }
  if (filter === "done") {
    return projects.filter((p) => p.status === "완료");
  }
  return projects;
}

export function countProjectsByStatus(projects: Project[]) {
  return {
    all: projects.length,
    progress: projects.filter((p) => p.status === "진행").length,
    hold: projects.filter((p) => p.status === "홀드").length,
    done: projects.filter((p) => p.status === "완료").length,
    active: projects.filter((p) => p.status !== "완료").length,
  };
}

export function getDefaultSelectedYear(availableYears: number[]): number {
  const currentYear = new Date().getFullYear();
  return availableYears.includes(currentYear)
    ? currentYear
    : availableYears[0] ?? currentYear;
}

export function dateInYear(isoDate: string, year: number): boolean {
  return parseInt(isoDate.slice(0, 4), 10) === year;
}

export function projectSpansYear(project: Project, year: number): boolean {
  const startY = parseInt(project.startDate.slice(0, 4), 10);
  const endY = parseInt(project.endDate.slice(0, 4), 10);
  return year >= startY && year <= endY;
}

export function getAvailableYears(projects: Project[]): number[] {
  const years = new Set<number>();
  for (const p of projects) {
    const startY = parseInt(p.startDate.slice(0, 4), 10);
    const endY = parseInt(p.endDate.slice(0, 4), 10);
    for (let y = startY; y <= endY; y++) years.add(y);
  }
  return [...years].sort((a, b) => b - a);
}

export function sortProjectsForDisplay(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return compareProjectCode(a.code, b.code);
  });
}

export function filterProjectsByYear(
  projects: Project[],
  year: number
): Project[] {
  return sortProjectsForDisplay(
    projects.filter((p) => projectSpansYear(p, year))
  );
}

export function filterProjectsBySearch(
  projects: Project[],
  query: string
): Project[] {
  const q = query.trim().toLowerCase();
  if (!q) return projects;
  return projects.filter(
    (p) =>
      p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
  );
}

export function splitTasksByProjectCategory(
  tasks: WeeklyTask[],
  projects: Project[]
): { operation: WeeklyTask[]; support: WeeklyTask[] } {
  const supportIds = new Set(
    projects.filter((p) => p.isSupportProject).map((p) => p.id)
  );
  return {
    operation: tasks.filter((t) => !supportIds.has(t.projectId)),
    support: tasks.filter((t) => supportIds.has(t.projectId)),
  };
}

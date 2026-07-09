import type { Project, ProjectStatus, WeeklyTask } from "@/types";

const STATUS_ORDER: Record<ProjectStatus, number> = {
  진행: 0,
  홀드: 1,
  완료: 2,
};

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
    return a.code.localeCompare(b.code);
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

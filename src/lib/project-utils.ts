import type { Project, ProjectStatus } from "@/types";

const STATUS_ORDER: Record<ProjectStatus, number> = {
  이슈: 0,
  진행: 1,
  홀드: 2,
  완료: 3,
};

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

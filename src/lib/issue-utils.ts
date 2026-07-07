import type { ProjectIssue } from "@/types";

/** 주간 보고: 진행 중은 주차 무관 표시, 완료는 등록 주차가 이번 보고 주일 때만 */
export function filterIssuesForReport(
  issues: ProjectIssue[],
  reportWeekStart: string
): ProjectIssue[] {
  return issues.filter(
    (issue) =>
      issue.status === "진행" ||
      (issue.status === "완료" && issue.weekStart === reportWeekStart)
  );
}

export function filterIssuesBySearch(
  issues: ProjectIssue[],
  query: string,
  options?: {
    getAuthorName?: (userId: string) => string | undefined;
    getProjectLabel?: (projectId: string) => string | undefined;
  }
): ProjectIssue[] {
  const q = query.trim().toLowerCase();
  if (!q) return issues;

  return issues.filter((issue) => {
    if (issue.content.toLowerCase().includes(q)) return true;
    if (issue.date.includes(q)) return true;
    const author = options?.getAuthorName?.(issue.userId);
    if (author?.toLowerCase().includes(q)) return true;
    const projectLabel = options?.getProjectLabel?.(issue.projectId);
    if (projectLabel?.toLowerCase().includes(q)) return true;
    return false;
  });
}

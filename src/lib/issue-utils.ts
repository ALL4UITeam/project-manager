import type { ProjectIssue } from "@/types";

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

/** 앱 내부 경로 (trailingSlash + query) */

export function meetingsListPath(options?: {
  projectId?: string;
  year?: number;
}) {
  const params = new URLSearchParams();
  if (options?.projectId) params.set("projectId", options.projectId);
  if (options?.year) params.set("year", String(options.year));
  const query = params.toString();
  return query ? `/meetings/?${query}` : "/meetings/";
}

export function meetingsViewPath(noteId: string, projectId: string) {
  const params = new URLSearchParams({
    noteId,
    projectId,
  });
  return `/meetings/view/?${params.toString()}`;
}

export function meetingsWritePath(projectId: string, noteId?: string) {
  const params = new URLSearchParams({ projectId });
  if (noteId) params.set("noteId", noteId);
  return `/meetings/write/?${params.toString()}`;
}

/** 배포 경로 prefix. 로컬 dev는 비워두고, 서버는 `/pm` */
export const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(
  /\/$/,
  ""
);

export function withBasePath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${p}`;
}

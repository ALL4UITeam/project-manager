export function generateShareToken() {
  return `share-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function plainTextToHtml(text: string) {
  if (!text.trim()) return "<p></p>";
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

import { withBasePath } from "@/lib/base-path";

function resolveShareUrl(path: string) {
  if (typeof window === "undefined") return withBasePath(path);
  return `${window.location.origin}${withBasePath(path)}`;
}

export function getMeetingShareUrl(shareToken: string) {
  const path = `/share/meetings/?token=${encodeURIComponent(shareToken)}`;
  return resolveShareUrl(path);
}

export function getScheduleShareUrl(shareToken: string) {
  const path = `/share/schedule/?token=${encodeURIComponent(shareToken)}`;
  return resolveShareUrl(path);
}

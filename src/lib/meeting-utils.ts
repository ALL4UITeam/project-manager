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

export function getMeetingShareUrl(shareToken: string) {
  if (typeof window === "undefined") {
    return `/share/meetings/${shareToken}`;
  }
  return `${window.location.origin}/share/meetings/${shareToken}`;
}

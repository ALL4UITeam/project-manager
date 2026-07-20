"use client";

import { cn } from "@/lib/utils";
import { plainTextToHtml } from "@/lib/meeting-utils";

/** TipTap HTML 상세 표시 — prose 플러그인 없이 단락·목록 간격 유지 */
export function RichTextContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const content = plainTextToHtml(html);

  return (
    <div
      className={cn(
        "max-w-none text-sm leading-relaxed text-foreground",
        "[&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_p:empty]:min-h-[1.25em] [&_p:has(br:only-child)]:min-h-[1.25em]",
        "[&_br]:block [&_br]:content-[''] [&_br]:mb-0",
        "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1",
        "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1",
        "[&_li]:my-0.5 [&_li>p]:my-0",
        "[&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:text-xl [&_h1]:font-bold",
        "[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold",
        "[&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold",
        "[&_a]:text-primary [&_a]:underline",
        "[&_strong]:font-semibold [&_em]:italic",
        "[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

"use client";

import { cn } from "@/lib/utils";
import { plainTextToHtml } from "@/lib/meeting-utils";

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
        "prose prose-sm max-w-none text-foreground",
        "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_a]:text-primary [&_a]:underline",
        "[&_strong]:font-semibold",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

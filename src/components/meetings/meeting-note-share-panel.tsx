"use client";

import { useState } from "react";
import { Copy, Check, Link2, Globe, Lock } from "lucide-react";
import type { MeetingNote } from "@/types";
import { useApp } from "@/context/app-context";
import { getMeetingShareUrl } from "@/lib/meeting-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function MeetingNoteSharePanel({ note }: { note: MeetingNote }) {
  const { setMeetingNoteLinkShare, canEditMeetingNote } = useApp();
  const [copied, setCopied] = useState(false);

  const shareUrl = getMeetingShareUrl(note.shareToken);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("공유 링크를 복사하세요", shareUrl);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Link2 className="h-4 w-4 text-primary" />
            링크로 공유
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            구글 문서처럼 링크를 가진 사람은 누구나 조회할 수 있습니다. 작성·수정은
            로그인한 팀원만 가능합니다.
          </p>
        </div>
        {note.linkShareEnabled ? (
          <Badge variant="secondary" className="gap-1">
            <Globe className="h-3 w-3" />
            링크 공개
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            비공개
          </Badge>
        )}
      </div>

      {canEditMeetingNote() && (
        <div className="mt-4 flex items-center gap-3">
          <Switch
            id={`share-${note.id}`}
            checked={note.linkShareEnabled}
            onCheckedChange={(checked) =>
              setMeetingNoteLinkShare(note.id, checked)
            }
          />
          <Label htmlFor={`share-${note.id}`} className="text-sm">
            링크가 있는 모든 사용자가 볼 수 있음
          </Label>
        </div>
      )}

      {note.linkShareEnabled && (
        <div className="mt-4 flex gap-2">
          <Input readOnly value={shareUrl} className="h-9 text-xs font-mono" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="mr-1 h-3.5 w-3.5" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="mr-1 h-3.5 w-3.5" />
                링크 복사
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

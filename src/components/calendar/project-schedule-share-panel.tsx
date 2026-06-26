"use client";

import { useState } from "react";
import { Copy, Check, Link2, Globe, Lock } from "lucide-react";
import type { Project } from "@/types";
import { useApp } from "@/context/app-context";
import { getScheduleShareUrl } from "@/lib/meeting-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function ProjectScheduleSharePanel({ project }: { project: Project }) {
  const { setProjectScheduleLinkShare, canEditCalendar } = useApp();
  const [copied, setCopied] = useState(false);

  const canEdit = canEditCalendar();
  const enabled = project.scheduleLinkShareEnabled ?? false;
  const token = project.scheduleShareToken;
  const shareUrl = token ? getScheduleShareUrl(token) : "";

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("공유 링크를 복사하세요", shareUrl);
    }
  };

  return (
    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Link2 className="h-4 w-4 text-emerald-600" />
            프로젝트 일정표 링크 공유
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            이 프로젝트 WBS 일정표 전체를 링크로 공유합니다. 회의록과 동일하게
            링크를 가진 사람은 로그인 없이 조회할 수 있습니다.
          </p>
        </div>
        {enabled ? (
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

      {canEdit && (
        <div className="mt-4 flex items-center gap-3">
          <Switch
            id={`schedule-share-${project.id}`}
            checked={enabled}
            onCheckedChange={(checked) =>
              setProjectScheduleLinkShare(project.id, checked)
            }
          />
          <Label htmlFor={`schedule-share-${project.id}`} className="text-sm">
            링크가 있는 모든 사용자가 이 프로젝트 일정표를 볼 수 있음
          </Label>
        </div>
      )}

      {enabled && shareUrl && (
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

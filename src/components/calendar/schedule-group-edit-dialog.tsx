"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import type { WorkPart } from "@/types";
import { WORK_PARTS } from "@/types";
import {
  FormDialogHeader,
  FormField,
  formInputClassName,
} from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ScheduleGroupEditTarget =
  | { type: "service"; service: string }
  | { type: "part"; service: string; part: WorkPart };

export function ScheduleGroupEditDialog({
  open,
  onOpenChange,
  target,
  onSaveService,
  onSavePart,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ScheduleGroupEditTarget | null;
  onSaveService: (oldService: string, newService: string) => void;
  onSavePart: (service: string, oldPart: WorkPart, newPart: WorkPart) => void;
}) {
  const [serviceName, setServiceName] = useState("");
  const [part, setPart] = useState<WorkPart>("기획");

  useEffect(() => {
    if (!open || !target) return;
    if (target.type === "service") {
      setServiceName(target.service);
    } else {
      setPart(target.part);
    }
  }, [open, target]);

  if (!target) return null;

  const handleSave = () => {
    if (target.type === "service") {
      const next = serviceName.trim();
      if (!next) return;
      onSaveService(target.service, next);
    } else {
      onSavePart(target.service, target.part, part);
    }
    onOpenChange(false);
  };

  const canSave =
    target.type === "service"
      ? serviceName.trim().length > 0 &&
        serviceName.trim() !== target.service
      : part !== target.part;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <FormDialogHeader
          icon={Pencil}
          accent="emerald"
          title={target.type === "service" ? "서비스 수정" : "구분 수정"}
          description={
            target.type === "service"
              ? `「${target.service}」에 속한 모든 행의 서비스명이 함께 변경됩니다.`
              : `「${target.service} / ${target.part}」에 속한 모든 상세업무의 구분이 함께 변경됩니다.`
          }
          badge="일괄"
        />
        <DialogBody className="space-y-4">
          {target.type === "service" ? (
            <FormField label="서비스명" required>
              <Input
                className={formInputClassName()}
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="예: Mobile, PC Web"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  }
                }}
              />
            </FormField>
          ) : (
            <FormField label="구분" required>
              <Select
                value={part}
                onValueChange={(v) => setPart(v as WorkPart)}
              >
                <SelectTrigger className={formInputClassName()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_PARTS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

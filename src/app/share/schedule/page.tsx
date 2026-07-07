"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PublicScheduleSharePage } from "@/components/calendar/public-schedule-share-page";

function ScheduleShareContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3">
        <p className="text-sm font-semibold text-primary">
          All4Land 프로젝트 일정표
        </p>
      </header>
      <PublicScheduleSharePage token={token} />
    </div>
  );
}

export default function ScheduleSharePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ScheduleShareContent />
    </Suspense>
  );
}

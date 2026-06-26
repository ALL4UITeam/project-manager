import { PublicScheduleSharePage } from "@/components/calendar/public-schedule-share-page";
import { mockProjects } from "@/data/mock-data";

export function generateStaticParams() {
  return mockProjects
    .filter((p) => p.scheduleShareToken)
    .map((p) => ({ token: p.scheduleShareToken! }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

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

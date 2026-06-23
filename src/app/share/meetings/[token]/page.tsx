import { PublicMeetingSharePage } from "@/components/meetings/public-meeting-share-page";
import { mockMeetingNotes } from "@/data/mock-data";

export function generateStaticParams() {
  return mockMeetingNotes.map((note) => ({ token: note.shareToken }));
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
        <p className="text-sm font-semibold text-primary">All4Land 회의록</p>
      </header>
      <PublicMeetingSharePage token={token} />
    </div>
  );
}

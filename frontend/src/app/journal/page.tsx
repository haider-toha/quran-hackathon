import { Journal } from "@/components/Journal";
import { FEATURED_NOTE_ID } from "@/lib/mock-data";

// Server Component. Reads `?note=<id>` from the URL and forwards the id to
// the client Journal component, which then performs a hybrid lookup
// (user-store first, sample notes second) on hydration. Falls back to the
// featured sample note when no `?note` is provided.
//
// Next.js 16 makes `searchParams` a Promise — we await it.
export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ note?: string }>;
}) {
  const { note } = await searchParams;
  const noteId = note ?? FEATURED_NOTE_ID;
  return <Journal noteId={noteId} />;
}

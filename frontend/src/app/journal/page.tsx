import { Journal } from "@/components/Journal";
import { findNote, FEATURED_NOTE_ID } from "@/lib/mock-data";
import { notFound } from "next/navigation";

export default function JournalPage() {
  const note = findNote(FEATURED_NOTE_ID);
  if (!note) notFound();
  return <Journal note={note} />;
}

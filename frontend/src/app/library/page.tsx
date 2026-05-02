import { Library } from "@/components/Library";
import { SAMPLE_NOTES } from "@/lib/mock-data";

export default function LibraryPage() {
  return <Library notes={SAMPLE_NOTES} />;
}

import { Settings } from "@/components/Settings";
import { TAFSIR_SOURCES, TAFSIR_93_3 } from "@/lib/mock-data";

export default function SettingsPage() {
  return <Settings sources={TAFSIR_SOURCES} sampleEntry={TAFSIR_93_3} />;
}

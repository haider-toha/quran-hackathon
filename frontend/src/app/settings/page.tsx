import { Settings } from "@/components/Settings";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = params.tab;
  const initialTab = typeof raw === "string" ? raw : null;
  return <Settings initialTab={initialTab} />;
}

import { Research } from "@/components/Research";
import {
  RESEARCH_QUESTION,
  RESEARCH_SYNTHESIS,
  RESEARCH_TOTAL_RESULTS,
  SAMPLE_RESEARCH,
} from "@/lib/mock-data";

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // `?q=` prefill — when the user lands here from the command palette or a
  // recent-search entry, treat the query as the starting research question.
  const params = await searchParams;
  const question = params.q && params.q.trim().length > 0 ? params.q : RESEARCH_QUESTION;
  return (
    <Research
      results={SAMPLE_RESEARCH}
      question={question}
      totalResults={RESEARCH_TOTAL_RESULTS}
      synthesis={RESEARCH_SYNTHESIS}
    />
  );
}

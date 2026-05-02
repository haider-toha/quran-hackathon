import { Research } from "@/components/Research";
import { RESEARCH_QUESTION, RESEARCH_TOTAL_RESULTS, SAMPLE_RESEARCH } from "@/lib/mock-data";

export default function ResearchPage() {
  return (
    <Research
      results={SAMPLE_RESEARCH}
      question={RESEARCH_QUESTION}
      totalResults={RESEARCH_TOTAL_RESULTS}
    />
  );
}

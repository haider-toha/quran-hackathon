// Research search API. Today returns the bundled `SAMPLE_RESEARCH` corpus
// regardless of query; the real implementation will hit the FastAPI
// research endpoint and pass the query through.

import { SAMPLE_RESEARCH } from "@/lib/mock-data";
import type { ResearchResult } from "@/types";

/**
 * Search the research corpus. The mock currently returns the same fixed
 * set of results for every query — the parameter is plumbed through so
 * callers can adopt the API now without changing shape later.
 */
export async function searchResearch(_query: string): Promise<readonly ResearchResult[]> {
  return SAMPLE_RESEARCH;
}

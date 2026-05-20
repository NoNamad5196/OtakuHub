import { SuggestionReview } from "@/components/suggestion-review";
import { getDashboardData } from "@/lib/data";

export default async function DiscoverPage() {
  const data = await getDashboardData();

  return (
    <SuggestionReview
      initialSuggestions={data.suggestions}
      sources={data.sources}
      franchises={data.franchises}
      runs={data.crawlRuns}
    />
  );
}

import { RadioTower } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SuggestionReview } from "@/components/suggestion-review";
import { getDashboardData } from "@/lib/data";

export default async function DiscoverPage() {
  const data = await getDashboardData();

  return (
    <>
      <PageHeader
        icon={RadioTower}
        title="수집/검수"
        description="네이버 라운지, DC, 공식 사이트에서 감지한 글을 Gemini가 일정 후보로 구조화합니다. 확정은 사용자가 합니다."
      />
      <SuggestionReview
        initialSuggestions={data.suggestions}
        sources={data.sources}
        franchises={data.franchises}
        runs={data.crawlRuns}
      />
    </>
  );
}

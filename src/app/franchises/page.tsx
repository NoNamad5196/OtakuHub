import { Star } from "lucide-react";
import { FranchiseManager } from "@/components/franchise-manager";
import { PageHeader } from "@/components/page-header";
import { getDashboardData } from "@/lib/data";

export default async function FranchisesPage() {
  const data = await getDashboardData();

  return (
    <>
      <PageHeader
        icon={Star}
        title="프랜차이즈"
        description="캐릭터/시리즈/그룹을 등록하고 캘린더 색상과 관심 우선순위를 관리합니다."
      />
      <FranchiseManager initialFranchises={data.franchises} />
    </>
  );
}

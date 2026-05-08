import { Gem } from "lucide-react";
import { CollectionManager } from "@/components/collection-manager";
import { PageHeader } from "@/components/page-header";
import { getDashboardData } from "@/lib/data";

export default async function CollectionsPage() {
  const data = await getDashboardData();

  return (
    <>
      <PageHeader
        icon={Gem}
        title="굿즈 컬렉션"
        description="이미 산 굿즈와 살 예정인 굿즈를 일정과 연결해서 추적합니다."
      />
      <CollectionManager initialItems={data.collections} franchises={data.franchises} events={data.events} />
    </>
  );
}

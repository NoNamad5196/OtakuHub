import { CollectionManager } from "@/components/collection-manager";
import { getDashboardData } from "@/lib/data";

export default async function CollectionsPage() {
  const data = await getDashboardData();

  return <CollectionManager initialItems={data.collections} franchises={data.franchises} events={data.events} />;
}

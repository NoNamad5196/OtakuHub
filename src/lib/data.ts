import { getDemoDashboardData } from "@/lib/mock-store";
import { getSupabaseDashboardData } from "@/lib/repositories/dashboard";
import type { DashboardData } from "@/lib/types";

export async function getDashboardData(): Promise<DashboardData> {
  try {
    return (await getSupabaseDashboardData()) ?? getDemoDashboardData();
  } catch (error) {
    console.warn("Falling back to demo dashboard data:", error);
    return getDemoDashboardData();
  }
}

export async function getFranchiseNameMap() {
  const data = await getDashboardData();
  return new Map(data.franchises.map((franchise) => [franchise.id, franchise.name]));
}

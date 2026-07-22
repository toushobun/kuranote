import { loadDashboardView } from "server/statistics/adapter/next/loadStatisticsViews";
import { DashboardTemplate } from "templates/dashboard/Dashboard";

export default async function DashboardPage() {
  const data = await loadDashboardView();

  return <DashboardTemplate data={data} />;
}

import { DashboardTemplate } from "dashboard-template/Dashboard";
import { loadDashboardView } from "server/loaders/dashboard";

export async function DashboardHome() {
  const data = await loadDashboardView();

  return <DashboardTemplate data={data} />;
}

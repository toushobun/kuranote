import { DashboardHome } from "./DashboardHome";
import { loadDashboardView } from "./load-data";

export default async function DashboardPage() {
  const data = await loadDashboardView();

  return <DashboardHome data={data} />;
}

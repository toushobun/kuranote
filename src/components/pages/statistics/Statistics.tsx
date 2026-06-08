import { loadStatisticsView } from "server/loaders/statistics";
import { StatisticsTemplate } from "templates/statistics/Statistics";

export async function StatisticsPage() {
  const view = await loadStatisticsView();

  return <StatisticsTemplate {...view} />;
}

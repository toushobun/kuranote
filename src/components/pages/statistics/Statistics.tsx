import { loadStatisticsView } from "server/loaders/statistics";
import { StatisticsTemplate } from "statistics-template/Statistics";

export async function StatisticsPage() {
  const view = await loadStatisticsView();

  return <StatisticsTemplate {...view} />;
}

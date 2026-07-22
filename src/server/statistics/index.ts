import { statisticsRouter } from "server/statistics/router";

export const statisticsModule = {
  basePath: "/statistics",
  name: "statistics",
  router: statisticsRouter,
};

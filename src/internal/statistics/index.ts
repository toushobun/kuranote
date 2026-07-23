import { statisticsRouter } from "internal/statistics/router";

export const statisticsModule = {
  basePath: "/statistics",
  name: "statistics",
  router: statisticsRouter,
};

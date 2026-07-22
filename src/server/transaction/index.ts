import { transactionRouter } from "server/transaction/router";

export const transactionModule = {
  basePath: "/transactions",
  name: "transaction",
  router: transactionRouter,
};

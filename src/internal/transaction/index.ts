import { transactionRouter } from "internal/transaction/router";

export const transactionModule = {
  basePath: "/transactions",
  name: "transaction",
  router: transactionRouter,
};

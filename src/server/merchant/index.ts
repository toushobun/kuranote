import { merchantRouter } from "server/merchant/router";
import type { ServerModule } from "server/serverModule";

export type { MerchantSummary } from "server/merchant/entity/merchantSummary";
export type { MerchantQueryService } from "server/merchant/service/merchantService";

/** 商家管理、搜索、建议与交易商家查询的统一业务入口。 */
export const merchantModule = {
  basePath: "/merchants",
  name: "merchant",
  router: merchantRouter,
} satisfies ServerModule;

import { merchantRouter } from "internal/merchant/router";
import type { InternalModule } from "internal/internalModule";

export type { MerchantSummary } from "internal/merchant/entity/merchantSummary";
export {
  isMerchantPageErrorCode,
  merchantErrorCodes,
  type MerchantErrorCode,
  type MerchantPageErrorCode,
  type MerchantValidationErrorCode,
} from "internal/merchant/errors";
export type { MerchantQueryService } from "internal/merchant/service/merchantService";

/** 商家管理、搜索、建议与交易商家查询的统一业务入口。 */
export const merchantModule = {
  basePath: "/merchants",
  name: "merchant",
  router: merchantRouter,
} satisfies InternalModule;

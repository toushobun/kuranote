import type { MerchantEntrySuggestions } from "internal/transaction";

/** 验证应用只提供静态建议，不连接业务数据库。 */
export function GET() {
  const suggestions: MerchantEntrySuggestions = {
    automaticCategoryIds: [],
    quickAmounts: [],
    recommendedAccountIds: [],
  };
  return Response.json(suggestions);
}

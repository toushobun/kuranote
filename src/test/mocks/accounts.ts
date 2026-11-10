import type { Account } from "types/accounts";

import {
  accountHolderOptionsFixture,
  createMemberAccountHolder,
} from "./accountHolders";

/** 测试与 Story 共用的编辑对象账户：银行卡，持有人为「我」。 */
export const bankAccountFixture: Account = {
  created_at: "2026-01-01T00:00:00.000Z",
  currency: "JPY",
  current_balance: 85000,
  has_transactions: false,
  holders: [createMemberAccountHolder(accountHolderOptionsFixture[0]!)],
  id: "00000000-0000-4000-8000-000000000001",
  initial_balance: 100000,
  name: "三菱UFJ银行",
  sort_order: 1,
  type: "bank",
};

export const accountWebsiteIconFixture = {
  website_url: "https://example.com",
  icon_url: `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#b81e32"/><path fill="white" d="M6 14l10-6 10 6v2H6zm3 4h3v6H9zm6 0h3v6h-3zm6 0h3v6h-3zM6 25h20v2H6z"/></svg>',
  )}`,
} as const;

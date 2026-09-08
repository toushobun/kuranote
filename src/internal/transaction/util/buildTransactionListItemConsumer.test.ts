// @vitest-environment node

import { describe, expect, it } from "vitest";

import { buildTransactionListItem } from "internal/transaction/util/buildTransactionListItem";

const transactionRecordId = "00000000-0000-4000-8000-000000000901";
const accountId = "00000000-0000-4000-8000-000000000041";
const categoryId = "00000000-0000-4000-8000-000000000101";
const merchantId = "00000000-0000-4000-8000-000000001001";
const userA = "00000000-0000-4000-8000-000000000031";
const userB = "00000000-0000-4000-8000-000000000033";

describe("buildTransactionListItem consumers", () => {
  it.each([true, false])(
    "按关联顺序映射消费者并复用成员可见性：%s",
    (showRecorder) => {
      const item = buildTransactionListItem({
        accountById: new Map([
          [accountId, { currency: "JPY", id: accountId, name: "现金" }],
        ]),
        canEdit: true,
        categoryById: new Map([
          [
            categoryId,
            {
              id: categoryId,
              name: "餐饮",
              parent_id: null,
              type: "expense" as const,
            },
          ],
        ]),
        consumerById: new Map([
          [
            userA,
            { display_color: "jade" as const, display_name: "淞文", id: userA },
          ],
          [
            userB,
            {
              display_color: "sakura" as const,
              display_name: "秋爽",
              id: userB,
            },
          ],
        ]),
        fallbackCurrency: "JPY",
        merchantById: new Map([
          [merchantId, { icon_url: null, id: merchantId, name: "便利店" }],
        ]),
        record: {
          created_at: "2026-09-08T01:00:00.000Z",
          created_by: userA,
          id: transactionRecordId,
          merchant_id: merchantId,
          note: null,
          transaction_at: "2026-09-08T01:00:00.000Z",
          type: "normal",
        },
        recordConsumers: [
          { transaction_record_id: transactionRecordId, user_id: userB },
          { transaction_record_id: transactionRecordId, user_id: userA },
        ],
        recordItems: [
          {
            account_id: accountId,
            amount: "1200",
            balance_delta: "-1200",
            category_id: categoryId,
            transaction_record_id: transactionRecordId,
          },
        ],
        showRecorder,
      });

      expect(item.consumers).toEqual([
        { color: "sakura", id: userB, name: "秋爽" },
        { color: "jade", id: userA, name: "淞文" },
      ]);
      expect(item.show_consumers).toBe(showRecorder);
    },
  );

  it("不存在消费者上下文时返回空数组而不是回退到记录人", () => {
    const item = buildTransactionListItem({
      accountById: new Map(),
      canEdit: false,
      categoryById: new Map(),
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: {
        created_at: "2026-09-08T01:00:00.000Z",
        created_by: userA,
        id: transactionRecordId,
        merchant_id: null,
        note: null,
        transaction_at: "2026-09-08T01:00:00.000Z",
        type: "normal",
      },
      recordItems: [],
    });

    expect(item.consumers).toEqual([]);
  });
});

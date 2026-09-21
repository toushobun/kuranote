import {
  makeBalanceAdjustmentUnit,
  makeIncomeExpenseUnit,
  makeTransferUnit,
} from "test/mocks/dataImport";
import { describe, expect, it } from "vitest";

import { collectHolderMappingCandidates } from "internal/dataImport/util/collectHolderMappingCandidates";

const members = [
  { displayName: "张三", userId: "user-1" },
  { displayName: "李四", userId: "user-2" },
  { displayName: "重名", userId: "user-3" },
  { displayName: "重名", userId: "user-4" },
];

describe("collectHolderMappingCandidates", () => {
  it("全部唯一匹配或无持有人时不需要映射", () => {
    const units = [
      makeIncomeExpenseUnit({ accountHolder: "张三" }),
      makeTransferUnit({ fromAccountHolder: "李四", toAccountHolder: null }),
      makeBalanceAdjustmentUnit({ accountHolder: null }),
    ];

    expect(collectHolderMappingCandidates(units, members)).toEqual([]);
  });

  it("汇总未匹配姓名并统计涉及记录数", () => {
    const units = [
      makeIncomeExpenseUnit({ accountHolder: "小明" }),
      makeIncomeExpenseUnit({ accountHolder: "小明" }),
      makeBalanceAdjustmentUnit({ accountHolder: "小明" }),
      makeIncomeExpenseUnit({ accountHolder: "张三" }),
    ];

    expect(collectHolderMappingCandidates(units, members)).toEqual([
      { name: "小明", recordCount: 3, reason: "unmatched" },
    ]);
  });

  it("同名多成员标记为歧义", () => {
    const units = [makeIncomeExpenseUnit({ accountHolder: "重名" })];

    expect(collectHolderMappingCandidates(units, members)).toEqual([
      { name: "重名", recordCount: 1, reason: "ambiguous" },
    ]);
  });

  it("转账转出与转入两侧都参与汇总", () => {
    const units = [
      makeTransferUnit({ fromAccountHolder: "小明", toAccountHolder: "小红" }),
    ];

    expect(collectHolderMappingCandidates(units, members)).toEqual([
      { name: "小明", recordCount: 1, reason: "unmatched" },
      { name: "小红", recordCount: 1, reason: "unmatched" },
    ]);
  });

  it("转账两侧同一姓名只算一条记录", () => {
    const units = [
      makeTransferUnit({ fromAccountHolder: "小明", toAccountHolder: "小明" }),
    ];

    expect(collectHolderMappingCandidates(units, members)).toEqual([
      { name: "小明", recordCount: 1, reason: "unmatched" },
    ]);
  });

  it("按姓名首次出现的顺序返回", () => {
    const units = [
      makeBalanceAdjustmentUnit({ accountHolder: "小红" }),
      makeIncomeExpenseUnit({ accountHolder: "小明" }),
      makeIncomeExpenseUnit({ accountHolder: "小红" }),
    ];

    expect(
      collectHolderMappingCandidates(units, members).map(({ name }) => name),
    ).toEqual(["小红", "小明"]);
  });
});

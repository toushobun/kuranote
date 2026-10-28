import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderConfirmFlow } from "test/transactionConfirmStep";
import { renderEntryComponent } from "test/transactionStepFlow";
import {
  itemsStepFixture,
  filledItems,
  twoPayments,
} from "test/mocks/transactionItemsStep";
import { TransactionItemHiddenFields } from "./TransactionFormHiddenFields";

function submittedData() {
  return new FormData(
    screen.getByRole("button", { name: "保存记账" }).closest("form")!,
  );
}
describe("TransactionFormHiddenFields", () => {
  it("单账户提交唯一主账户和有序明细，不提交多账户字段", () => {
    renderConfirmFlow();
    const data = submittedData();
    expect(data.getAll("merchantId")).toEqual(["seven"]);
    expect(data.getAll("accountId")).toEqual(["paypay"]);
    expect(data.getAll("paymentAccountId")).toEqual([]);
    expect(data.getAll("itemCategoryId")).toEqual(["lunch", "storage"]);
    expect(data.getAll("itemAmount")).toEqual(["8000", "2000"]);
    expect(data.getAll("itemSpecialStatus")).toEqual(["", ""]);
    expect(data.get("transactionAt")).toMatch(/T\d{2}:\d{2}:\d{2}$/);
    expect(data.get("timeZoneOffsetMinutes")).not.toBe("");
    expect(data.get("type")).toBe("expense");
  });
  it("多账户按行提交账户和金额，不再提交单账户字段", () => {
    renderConfirmFlow({
      itemsOptions: {
        ...itemsStepFixture,
        initialItems: filledItems,
        initialPayments: twoPayments,
      },
    });
    const data = submittedData();
    expect(data.getAll("accountId")).toEqual([]);
    expect(data.getAll("paymentAccountId")).toEqual(["paypay", "cash"]);
    expect(data.getAll("paymentAmount")).toEqual(["7000", "3000"]);
  });
  it("共用明细字段保留特殊状态和编辑版本", () => {
    const view = renderEntryComponent(
      <form>
        <TransactionItemHiddenFields
          item={{
            id: 1,
            persistedId: "item-id",
            expectedUpdatedAt: "version",
            categoryId: "lunch",
            amount: "100",
            specialStatus: "pendingReimbursement",
          }}
        />
      </form>,
    );
    const data = new FormData(view.container.querySelector("form")!);
    expect(data.get("itemPersistedId")).toBe("item-id");
    expect(data.get("itemSpecialStatus")).toBe("pendingReimbursement");
    expect(Array.from(data.values())).toContain("version");
  });
});

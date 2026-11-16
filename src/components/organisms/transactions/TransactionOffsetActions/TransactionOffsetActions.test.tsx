import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { TransactionFormInitialValues } from "../TransactionForm/TransactionForm.types";
import { TransactionOffsetActions } from "./TransactionOffsetActions";
const initialValues: TransactionFormInitialValues = {
  type: "expense",
  transactionRecordId: "record",
  merchantId: "merchant",
  note: "",
  transactionAt: "",
  items: [],
  payments: [],
};
afterEach(cleanup);
describe("TransactionOffsetActions", () => {
  it.each(["income", "transfer", "balance_adjustment"] as const)(
    "%s 不显示入口",
    (type) => {
      render(
        <TransactionOffsetActions
          transactionItemSpecialStatusEnabled
          initialValues={{ ...initialValues, type }}
          canWriteTransactions
        />,
      );
      expect(screen.queryByRole("link")).toBeNull();
    },
  );
  it("无记账权限不显示入口", () => {
    render(
      <TransactionOffsetActions
          transactionItemSpecialStatusEnabled
        initialValues={initialValues}
        canWriteTransactions={false}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
  });
  it.each([false, true])(
    "特殊状态开关关闭时不显示退款和报销入口（待报销：%s）",
    (pending) => {
      render(
        <TransactionOffsetActions
          initialValues={{
            ...initialValues,
            items: [
              {
                amount: "30",
                categoryId: "expense",
                specialStatus: pending ? "pendingReimbursement" : null,
              },
            ],
          }}
          canWriteTransactions
          transactionItemSpecialStatusEnabled={false}
        />,
      );
      expect(screen.queryByRole("link", { name: "记录退款" })).toBeNull();
      expect(screen.queryByRole("link", { name: "记录报销到账" })).toBeNull();
    },
  );
  it.each([false, true])(
    "支出显示退款，待报销状态为 %s 时按条件显示报销入口",
    (pending) => {
      render(
        <TransactionOffsetActions
          transactionItemSpecialStatusEnabled
          initialValues={{
            ...initialValues,
            items: [
              {
                amount: "30",
                categoryId: "expense",
                specialStatus: pending ? "pendingReimbursement" : null,
              },
            ],
          }}
          canWriteTransactions
        />,
      );
      expect(screen.getByRole("link", { name: "记录退款" })).toHaveAttribute(
        "href",
        "/transactions/new?refundFrom=record",
      );
      expect(
        Boolean(screen.queryByRole("link", { name: "记录报销到账" })),
      ).toBe(pending);
    },
  );
});

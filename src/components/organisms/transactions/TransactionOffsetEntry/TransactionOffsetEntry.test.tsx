import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { offsetEntry } from "test/mocks/transactionOffsetEntry";
import {
  TransactionOffsetEntryContext,
  TransactionOffsetEntryNotice,
} from "./TransactionOffsetEntry";
afterEach(cleanup);
describe("TransactionOffsetEntryNotice", () => {
  it.each(["refund", "reimbursement"] as const)(
    "显示 %s 来源小提示",
    (kind) => {
      render(
        <TransactionOffsetEntryContext value={{ ...offsetEntry, kind }}>
          <TransactionOffsetEntryNotice />
        </TransactionOffsetEntryContext>,
      );
      expect(screen.getByRole("alert")).toHaveTextContent(
        kind === "refund" ? "记录退款" : "记录报销到账",
      );
      expect(screen.getByRole("alert")).toHaveTextContent("7-Eleven");
      expect(screen.getByRole("alert")).toHaveTextContent("USB-C 充电器，办公室备用");
    },
  );
  it("明细备注为空时回退分类名，空白备注也视为无说明", () => {
    render(
      <TransactionOffsetEntryContext
        value={{
          ...offsetEntry,
          candidates: [
            {
              ...offsetEntry.candidates[0],
              note: "   ",
            },
          ],
        }}
      >
        <TransactionOffsetEntryNotice />
      </TransactionOffsetEntryContext>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("旧午餐");
  });
  it("普通新增不显示提示", () => {
    render(<TransactionOffsetEntryNotice />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TransactionPaymentFields } from "./TransactionPaymentFields";
import {
  createPaymentFieldsProps,
  createPaymentRows,
  paymentFieldsAccountOptions,
} from "./transactionPaymentFields.testUtils";

function renderFields(
  overrides: Parameters<typeof createPaymentFieldsProps>[0] = {},
) {
  return render(
    <TransactionPaymentFields {...createPaymentFieldsProps(overrides)} />,
  );
}

function getFieldValues(container: HTMLElement, name: string) {
  return Array.from(
    container.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`),
  ).map((input) => input.value);
}

describe("TransactionPaymentFields", () => {
  afterEach(cleanup);

  describe("单账户", () => {
    it("与原来一样提交 accountId，并显示添加付款账户入口", () => {
      const onAddPayment = vi.fn();
      const { container } = renderFields({ onAddPayment });

      expect(getFieldValues(container, "accountId")).toEqual([
        paymentFieldsAccountOptions[0]!.id,
      ]);
      expect(getFieldValues(container, "paymentAccountId")).toEqual([]);
      expect(screen.queryByRole("status")).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: "添加付款账户" }));
      expect(onAddPayment).toHaveBeenCalledTimes(1);
    });

    it("含收入明细时不显示添加付款账户入口", () => {
      renderFields({ canAddPayment: false });

      expect(screen.queryByRole("button", { name: "添加付款账户" })).toBeNull();
    });

    it("没有其他可添加的同币种账户时入口不可用", () => {
      renderFields({ accountOptions: paymentFieldsAccountOptions.slice(0, 1) });

      expect(
        screen.getByRole("button", { name: "添加付款账户" }),
      ).toBeDisabled();
    });

    it("显示字段错误", () => {
      renderFields({ fieldError: "请选择账户。" });

      expect(screen.getByText("请选择账户。")).toBeInTheDocument();
    });
  });

  describe("多账户", () => {
    it("每行提交账户与金额，不提交 accountId", () => {
      const { container } = renderFields({
        payments: createPaymentRows(["2000", "1500"]),
      });

      expect(getFieldValues(container, "accountId")).toEqual([]);
      expect(getFieldValues(container, "paymentAccountId")).toEqual([
        paymentFieldsAccountOptions[0]!.id,
        paymentFieldsAccountOptions[1]!.id,
      ]);
      expect(getFieldValues(container, "paymentAmount")).toEqual([
        "2000",
        "1500",
      ]);
    });

    it("其他行已选与异币种的账户不可选", () => {
      renderFields({ payments: createPaymentRows(["2000", "1500"]) });

      fireEvent.mouseDown(screen.getByRole("combobox", { name: "付款账户 2" }));
      const listbox = screen.getByRole("listbox");
      expect(
        within(listbox).getByRole("option", { name: "礼品卡（JPY）" }),
      ).toHaveAttribute("aria-disabled", "true");
      expect(
        within(listbox).getByRole("option", { name: "美元卡（USD）" }),
      ).toHaveAttribute("aria-disabled", "true");
      expect(
        within(listbox).getByRole("option", { name: "信用卡（JPY）" }),
      ).not.toHaveAttribute("aria-disabled", "true");
    });

    it("修改金额、删除行时回调对应行", () => {
      const onAmountChange = vi.fn();
      const onRemovePayment = vi.fn();
      renderFields({
        onAmountChange,
        onRemovePayment,
        payments: createPaymentRows(["2000", "1500"]),
      });

      fireEvent.change(screen.getByRole("textbox", { name: "付款金额 2" }), {
        target: { value: "1000" },
      });
      fireEvent.click(screen.getByRole("button", { name: "删除付款账户 1" }));

      expect(onAmountChange).toHaveBeenCalledWith(2, "1000");
      expect(onRemovePayment).toHaveBeenCalledWith(1);
    });

    it("平衡时对账条只显示两个合计", () => {
      renderFields({ payments: createPaymentRows(["2000", "1500"]) });

      expect(screen.getByRole("status")).toHaveTextContent(
        "付款合计 ¥3,500 / 明细合计 ¥3,500",
      );
      expect(screen.queryByText(/^差额/)).toBeNull();
    });

    it("不平衡时显示差额", () => {
      renderFields({ payments: createPaymentRows(["2000", ""]) });

      expect(screen.getByRole("status")).toHaveTextContent(
        "付款合计 ¥2,000 / 明细合计 ¥3,500差额 ¥1,500",
      );
    });

    it("金额为 0 的行保留显示", () => {
      const { container } = renderFields({
        payments: createPaymentRows(["3500", "0"]),
      });

      expect(getFieldValues(container, "paymentAmount")).toEqual(["3500", "0"]);
      expect(screen.queryByText(/^差额/)).toBeNull();
    });

    it("显示提交前校验的错误，含收入明细时不显示添加入口", () => {
      renderFields({
        canAddPayment: false,
        fieldError: "含收入明细的记录只能选择一个付款账户。",
        payments: createPaymentRows(["2000", "1500"]),
      });

      expect(
        screen.getByText("含收入明细的记录只能选择一个付款账户。"),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "添加付款账户" })).toBeNull();
    });
  });
});

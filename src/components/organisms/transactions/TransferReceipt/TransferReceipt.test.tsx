import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EditTransactionDirtyProvider } from "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext";
import { flowFixture } from "test/mocks/transactionStepFlow";
import { ReceiptCreationTestProviders } from "test/receiptCreation";
import { pressItemAmountKey } from "test/transactionConfirmStep";
import type { TransferEditInitialValues } from "types/transactions";

import { TransferReceipt } from "./TransferReceipt";

const editValues: TransferEditInitialValues = {
  accountId: "cash",
  note: "取现",
  transactionAt: "2026-06-05T03:20:10.000Z",
  transactionRecordId: "record-1",
  transferAmount: "5000",
  transferTargetAccountId: "paypay",
  type: "transfer",
};

function setup(props: Partial<Parameters<typeof TransferReceipt>[0]> = {}) {
  const action = vi.fn();
  const onDirty = vi.fn();
  const onValidationFailed = vi.fn();
  render(
    <EditTransactionDirtyProvider onDirty={onDirty}>
      <TransferReceipt
        formId="transfer-form"
        action={action}
        accountOptions={flowFixture.accounts}
        onValidationFailed={onValidationFailed}
        {...props}
      />
    </EditTransactionDirtyProvider>,
    { wrapper: ReceiptCreationTestProviders },
  );
  return { action, onDirty, onValidationFailed };
}

function click(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name, hidden: true }));
}

function chooseAccount(side: "转出" | "转入", name: string) {
  click(new RegExp(`^更换${side}账户：`));
  fireEvent.click(screen.getByRole("radio", { name }));
}

function enterAmount(...keys: string[]) {
  click(/^修改转账金额：/);
  keys.forEach(pressItemAmountKey);
  pressItemAmountKey("确定");
}

function submittedForm(action: ReturnType<typeof vi.fn>) {
  return action.mock.calls[0]![0] as FormData;
}

describe("TransferReceipt", () => {
  it("刚打开时转出、转入都未选择，金额待输入，还不标红", () => {
    setup();
    expect(
      screen.getByRole("button", { name: "更换转出账户：选择账户" }),
    ).not.toHaveAttribute("data-invalid");
    expect(
      screen.getByRole("button", { name: "更换转入账户：选择账户" }),
    ).toBeInTheDocument();
    expect(screen.getByText("待输入")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: "保存转账" })).toBeEnabled();
  });

  it("点保存后才显示未完成的项目并标红，点提示打开对应的选择", () => {
    const { action, onValidationFailed } = setup();
    click("保存转账");
    expect(action).not.toHaveBeenCalled();
    expect(onValidationFailed).toHaveBeenCalledOnce();
    const alerts = screen
      .getAllByRole("alert")
      .map((alert) => alert.textContent);
    expect(alerts).toEqual([
      "请选择转出账户",
      "请选择转入账户",
      "请输入转账金额",
    ]);
    expect(
      screen.getByRole("button", { name: "更换转出账户：选择账户" }),
    ).toHaveAttribute("data-invalid", "true");
    click("请选择转入账户");
    expect(screen.getByRole("radiogroup", { name: "收支账户" })).toBeVisible();
  });

  it("已解决的问题再次出现时不显示，下次保存才显示", async () => {
    setup();
    chooseAccount("转出", "现金 JPY");
    chooseAccount("转入", "招商银行卡 CNY");
    click("保存转账");
    expect(screen.getByText("暂不支持不同币种之间的转账")).toBeInTheDocument();
    chooseAccount("转入", "PayPay JPY");
    await waitFor(() =>
      expect(screen.queryByText("暂不支持不同币种之间的转账")).toBeNull(),
    );
    chooseAccount("转入", "招商银行卡 CNY");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "更换转入账户：招商银行卡" }),
      ).toBeVisible(),
    );
    expect(screen.queryByText("暂不支持不同币种之间的转账")).toBeNull();
    click("保存转账");
    expect(screen.getByText("暂不支持不同币种之间的转账")).toBeInTheDocument();
  });

  it("选账户时不列出另一边已选的账户，填完后提交转账字段", async () => {
    const { action } = setup();
    chooseAccount("转出", "现金 JPY");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "更换转出账户：现金" }),
      ).toBeVisible(),
    );
    click(/^更换转入账户：/);
    expect(screen.queryByRole("radio", { name: "现金 JPY" })).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "PayPay JPY" }));
    enterAmount("5", "0", "0", "0");
    await waitFor(() => expect(screen.getByText("¥5,000")).toBeInTheDocument());
    click("保存转账");
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const form = submittedForm(action);
    expect(form.get("type")).toBe("transfer");
    expect(form.get("accountId")).toBe("cash");
    expect(form.get("transferTargetAccountId")).toBe("paypay");
    expect(form.get("transferAmount")).toBe("5000");
    expect(form.get("transactionAt")).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(form.has("transactionRecordId")).toBe(false);
  });

  it("转出与转入币种不同时不能保存", async () => {
    const { action } = setup();
    chooseAccount("转出", "招商银行卡 CNY");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "更换转出账户：招商银行卡" }),
      ).toBeVisible(),
    );
    chooseAccount("转入", "现金 JPY");
    enterAmount("1");
    click("保存转账");
    expect(action).not.toHaveBeenCalled();
    expect(
      screen
        .getAllByRole("alert", { hidden: true })
        .map((alert) => alert.textContent),
    ).toEqual(["暂不支持不同币种之间的转账"]);
  });

  it("编辑转账预填原记录，动过才报告未保存，提交原记录 id 与类型", async () => {
    const { action, onDirty } = setup({
      initialValues: editValues,
      sourceType: "transfer",
    });
    expect(
      screen.getByRole("button", { name: "更换转出账户：现金" }),
    ).toBeVisible();
    expect(screen.getByText("¥5,000")).toBeInTheDocument();
    expect(screen.getByText("取现")).toBeInTheDocument();
    await waitFor(() => expect(onDirty).toHaveBeenLastCalledWith(false));
    chooseAccount("转入", "乐天银行 JPY");
    await waitFor(() => expect(onDirty).toHaveBeenLastCalledWith(true));
    click("保存修改");
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const form = submittedForm(action);
    expect(form.get("transactionRecordId")).toBe("record-1");
    expect(form.get("sourceType")).toBe("transfer");
    expect(form.get("transferTargetAccountId")).toBe("bank");
    expect(form.get("note")).toBe("取现");
  });

  it("只读详情没有铅笔、提示和保存", () => {
    setup({ initialValues: editValues, readOnly: true });
    const receipt = screen
      .getByText("现金", { selector: "p" })
      .closest("form")!;
    expect(within(receipt).queryByRole("button")).toBeNull();
    expect(screen.getByText("取现")).toBeInTheDocument();
  });
});

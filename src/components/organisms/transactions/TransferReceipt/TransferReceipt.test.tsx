import {
  cleanup,
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

  it("跨币种缺少到账金额时点保存才标红，换回同币种后提示消失", async () => {
    setup();
    chooseAccount("转出", "现金 JPY");
    chooseAccount("转入", "招商银行卡 CNY");
    click("保存转账");
    expect(screen.getByText("请输入到账金额")).toBeInTheDocument();
    chooseAccount("转入", "PayPay JPY");
    await waitFor(() =>
      expect(screen.queryByText("请输入到账金额")).toBeNull(),
    );
    chooseAccount("转入", "招商银行卡 CNY");
    expect(screen.queryByText("请输入到账金额")).toBeNull();
    click("保存转账");
    expect(screen.getByText("请输入到账金额")).toBeInTheDocument();
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

  it("跨币种必须填写两个金额才能保存", async () => {
    const { action } = setup();
    chooseAccount("转出", "招商银行卡 CNY");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "更换转出账户：招商银行卡" }),
      ).toBeVisible(),
    );
    chooseAccount("转入", "现金 JPY");
    click(/^修改转出金额：/);
    pressItemAmountKey("1");
    pressItemAmountKey("确定");
    click("保存转账");
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByText("请输入到账金额")).toBeInTheDocument();
    click(/^修改到账金额：/);
    pressItemAmountKey("2");
    pressItemAmountKey("确定");
    click("保存转账");
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(submittedForm(action).get("transferTargetAmount")).toBe("2");
  });

  it("先选转入账户并填金额，再补选另一币种转出账户时保留到账金额", async () => {
    const { action } = setup();
    chooseAccount("转入", "现金 JPY");
    enterAmount("5", "0", "0", "0");
    // 金额抽屉有关闭动画，待其解除 aria-hidden 后再打开账户抽屉。
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^更换转出账户：/ }),
      ).toBeVisible(),
    );
    chooseAccount("转出", "招商银行卡 CNY");
    expect(screen.getByText("¥5,000")).toBeInTheDocument();
    click("保存转账");
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByText("请输入转出金额")).toBeInTheDocument();
    click(/^修改转出金额：/);
    pressItemAmountKey("2");
    pressItemAmountKey("确定");
    click("保存转账");
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const form = submittedForm(action);
    expect(form.get("transferAmount")).toBe("2");
    expect(form.get("transferTargetAmount")).toBe("5000");
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

  it("同币种编辑切换账户后再恢复，不因隐藏到账金额误报未保存", async () => {
    const { onDirty } = setup({
      initialValues: { ...editValues, transferTargetAmount: "5000" },
      sourceType: "transfer",
    });
    await waitFor(() => expect(onDirty).toHaveBeenLastCalledWith(false));
    chooseAccount("转入", "乐天银行 JPY");
    await waitFor(() => expect(onDirty).toHaveBeenLastCalledWith(true));
    chooseAccount("转入", "PayPay JPY");
    await waitFor(() => expect(onDirty).toHaveBeenLastCalledWith(false));
  });

  it("跨币种转出金额提示与计算器标题对应币种", () => {
    const { action } = setup({
      initialValues: {
        ...editValues,
        transferTargetAccountId: "cny",
        transferAmount: "1.5",
        transferTargetAmount: "50",
      },
    });
    click("保存修改");
    expect(action).not.toHaveBeenCalled();
    expect(
      screen.getByText("转出金额无效，点一下重新输入"),
    ).toBeInTheDocument();
    click(/^修改转出金额：/);
    expect(
      screen.getByRole("heading", { name: "转出金额（JPY）" }),
    ).toBeInTheDocument();
  });

  it("跨币种到账金额计算器标题只显示到账金额和币种", () => {
    setup({
      initialValues: {
        ...editValues,
        transferTargetAccountId: "cny",
        transferAmount: "100000",
        transferTargetAmount: "4850",
      },
    });
    click(/^修改到账金额：/);
    expect(
      screen.getByRole("heading", { name: "到账金额（CNY）" }),
    ).toBeInTheDocument();
  });

  it("无参考汇率时只读跨币种保持方案 A 的汇率显示", async () => {
    setup({
      initialValues: {
        ...editValues,
        accountId: "cash",
        transferTargetAccountId: "cny",
        transferAmount: "100000",
        transferTargetAmount: "4850",
      },
      readOnly: true,
      loadDailyRate: async () => null,
    });
    expect(screen.getByText("转出金额")).toBeInTheDocument();
    expect(screen.getByText("到账金额")).toBeInTheDocument();
    expect(
      await screen.findByText(/汇率 1 CNY ≈ 20.62 JPY（按两边金额算出）/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "保存转账" })).toBeNull();
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

const rateScenario = {
  ...editValues,
  accountId: "cny",
  transferTargetAccountId: "cash",
  transferAmount: "100",
  transferTargetAmount: "2050",
  transactionAt: "2026-11-19T12:20:10+09:00",
};
const referenceRate = async () => ({
  rate: 21.05,
  rateDate: "2026-11-19",
});

describe("TransferReceipt 按当天汇率预填", () => {
  it("新增跨币种时只填写转出金额就自动预填并能提交，不把汇率作为字段保存", async () => {
    const { action } = setup({ loadDailyRate: referenceRate });
    chooseAccount("转出", "招商银行卡 CNY");
    chooseAccount("转入", "现金 JPY");
    click(/^修改转出金额：/);
    pressItemAmountKey("1");
    pressItemAmountKey("0");
    pressItemAmountKey("0");
    pressItemAmountKey("确定");

    expect(
      await screen.findByText(/按当天汇率 1 CNY = 21.05 JPY（11\/19）/),
    ).toBeInTheDocument();
    expect(screen.getByText("¥2,105")).toBeInTheDocument();

    click("保存转账");
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const form = submittedForm(action);
    expect(form.get("transferAmount")).toBe("100");
    expect(form.get("transferTargetAmount")).toBe("2105");
    expect(form.has("rate")).toBe(false);
  });

  it("改交易日期后重新查询新日期汇率，并自动重算到账金额", async () => {
    const loadDailyRate = vi.fn(({ date }: { date: string }) =>
      Promise.resolve({
        rate: date === "2026-11-19" ? 21.05 : 22,
        rateDate: date,
      }),
    );
    const { action } = setup({
      initialValues: rateScenario,
      loadDailyRate,
    });
    expect(await screen.findByText(/当天汇率 1 CNY = 21.05 JPY/)).toBeInTheDocument();
    click("恢复按当天汇率");
    expect(await screen.findByText("¥2,105")).toBeInTheDocument();

    click(/^修改时间：/);
    fireEvent.click(
      screen.getByRole("button", { name: "2026年11月20日" }),
    );
    await waitFor(() =>
      expect(loadDailyRate).toHaveBeenCalledWith(
        { from: "CNY", to: "JPY", date: "2026-11-20" },
        expect.any(AbortSignal),
      ),
    );
    expect(await screen.findByText(/按当天汇率 1 CNY = 22 JPY（11\/20）/)).toBeInTheDocument();
    expect(screen.getByText("¥2,200")).toBeInTheDocument();
    click("保存修改");
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(submittedForm(action).get("transferTargetAmount")).toBe("2200");
  });

  it("有参考汇率时只填到账金额不会反推转出金额，也不会覆盖手填值", async () => {
    const { action } = setup({ loadDailyRate: referenceRate });
    chooseAccount("转出", "招商银行卡 CNY");
    chooseAccount("转入", "现金 JPY");
    await screen.findByText(/到账金额/);
    click(/^修改到账金额：/);
    pressItemAmountKey("5");
    pressItemAmountKey("0");
    pressItemAmountKey("0");
    pressItemAmountKey("0");
    pressItemAmountKey("确定");

    expect(screen.getByText("¥5,000")).toBeInTheDocument();
    click("保存转账");
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByText("请输入转出金额")).toBeInTheDocument();
    expect(
      (document.querySelector('input[name="transferAmount"]') as HTMLInputElement)
        .value,
    ).toBe("");
    expect(
      (document.querySelector('input[name="transferTargetAmount"]') as HTMLInputElement)
        .value,
    ).toBe("5000");
  });

  it("未手改到账金额时清空转出金额，自动到账金额也清空", async () => {
    const { action } = setup({ loadDailyRate: referenceRate });
    chooseAccount("转出", "招商银行卡 CNY");
    chooseAccount("转入", "现金 JPY");
    click(/^修改转出金额：/);
    pressItemAmountKey("1");
    pressItemAmountKey("0");
    pressItemAmountKey("0");
    pressItemAmountKey("确定");
    expect(await screen.findByText("¥2,105")).toBeInTheDocument();

    click(/^修改转出金额：/);
    pressItemAmountKey("清空");
    pressItemAmountKey("确定");
    expect(screen.queryByText("¥2,105")).toBeNull();
    expect(
      (document.querySelector('input[name="transferTargetAmount"]') as HTMLInputElement)
        .value,
    ).toBe("");
    click("保存转账");
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByText("转出金额无效，点一下重新输入")).toBeInTheDocument();
    expect(screen.getByText("请输入到账金额")).toBeInTheDocument();
  });

  it("手动金额显示实际汇率、参考汇率和少到账差额，恢复后重算", async () => {
    const { onDirty } = setup({
      initialValues: rateScenario,
      loadDailyRate: referenceRate,
    });
    await waitFor(() => expect(onDirty).toHaveBeenLastCalledWith(false));
    expect(
      await screen.findByText(/实际汇率 1 CNY ≈ 20.5 JPY/),
    ).toBeInTheDocument();
    expect(screen.getByText(/当天汇率 1 CNY = 21.05 JPY/)).toBeInTheDocument();
    expect(screen.getByText(/少到账.*JPY/)).toBeInTheDocument();
    click("恢复按当天汇率");
    expect(
      await screen.findByText(/按当天汇率 1 CNY = 21.05 JPY/),
    ).toBeInTheDocument();
    expect(screen.getByText("¥2,105")).toBeInTheDocument();
    expect(screen.queryByText(/少到账/)).toBeNull();
    await waitFor(() => expect(onDirty).toHaveBeenLastCalledWith(true));
  });

  it("只读和编辑已保存金额不被请求改写，读取参考汇率不产生未保存提示", async () => {
    const { onDirty } = setup({
      initialValues: rateScenario,
      loadDailyRate: referenceRate,
    });
    expect(
      await screen.findByText(/实际汇率 1 CNY ≈ 20.5 JPY/),
    ).toBeInTheDocument();
    expect(screen.getByText("¥2,050")).toBeInTheDocument();
    await waitFor(() => expect(onDirty).toHaveBeenLastCalledWith(false));

    cleanup();
    const { action } = setup({
      initialValues: rateScenario,
      loadDailyRate: referenceRate,
      readOnly: true,
    });
    expect(
      await screen.findAllByText(/实际汇率 1 CNY ≈ 20.5 JPY/),
    ).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "恢复按当天汇率" })).toBeNull();
    expect(action).not.toHaveBeenCalled();
  });

  it("换转出币种后不会把自动预填的到账金额误认为手动金额", async () => {
    const loadDailyRate = vi.fn(({ from }: { from: string }) =>
      Promise.resolve({
        rate: from === "CNY" ? 21.05 : 150,
        rateDate: "2026-11-19",
      }),
    );
    const { action } = setup({
      loadDailyRate,
      accountOptions: [
        ...flowFixture.accounts,
        {
          ...flowFixture.accounts[0]!,
          id: "usd",
          name: "美元账户",
          currency: "USD",
        },
      ],
    });
    chooseAccount("转出", "招商银行卡 CNY");
    chooseAccount("转入", "现金 JPY");
    click(/^修改转出金额：/);
    pressItemAmountKey("1");
    pressItemAmountKey("0");
    pressItemAmountKey("0");
    pressItemAmountKey("确定");
    expect(await screen.findByText("¥2,105")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "转出金额（CNY）" }),
      ).toBeNull(),
    );
    chooseAccount("转出", "美元账户 USD");
    expect(screen.queryByText("¥2,105")).toBeNull();
    click(/^修改转出金额：/);
    pressItemAmountKey("2");
    pressItemAmountKey("确定");
    expect(await screen.findByText("¥300")).toBeInTheDocument();
    click("保存转账");
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(submittedForm(action).get("transferTargetAmount")).toBe("300");
  });

  it("无汇率时退回手动填写，不自动反推转出金额", async () => {
    const loadDailyRate = vi.fn().mockResolvedValue(null);
    const { action } = setup({ loadDailyRate });
    chooseAccount("转出", "招商银行卡 CNY");
    chooseAccount("转入", "现金 JPY");
    click(/^修改转出金额：/);
    pressItemAmountKey("1");
    pressItemAmountKey("0");
    pressItemAmountKey("0");
    pressItemAmountKey("确定");

    await waitFor(() => expect(loadDailyRate).toHaveBeenCalled());
    click("保存转账");
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByText("请输入到账金额")).toBeInTheDocument();
    expect(screen.queryByText(/当天汇率 1/)).toBeNull();
  });

  it("旧请求晚于新币种返回也不会覆盖新币种的预填", async () => {
    let finishOld:
      | ((value: { rate: number; rateDate: string }) => void)
      | undefined;
    const loadDailyRate = vi.fn(({ to }: { to: string }) =>
      to === "JPY"
        ? new Promise<{ rate: number; rateDate: string }>((resolve) => {
            finishOld = resolve;
          })
        : Promise.resolve({ rate: 7, rateDate: "2026-11-20" }),
    );
    const { action } = setup({
      loadDailyRate,
      accountOptions: [
        ...flowFixture.accounts,
        {
          ...flowFixture.accounts[0]!,
          id: "usd",
          name: "美元账户",
          currency: "USD",
        },
      ],
    });
    chooseAccount("转出", "招商银行卡 CNY");
    chooseAccount("转入", "现金 JPY");
    click(/^修改转出金额：/);
    pressItemAmountKey("1");
    pressItemAmountKey("0");
    pressItemAmountKey("0");
    pressItemAmountKey("确定");
    await waitFor(() => expect(finishOld).toBeDefined());
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "转出金额（CNY）" }),
      ).toBeNull(),
    );
    chooseAccount("转入", "美元账户 USD");
    expect(
      await screen.findByText(/按当天汇率 1 CNY = 7 USD/),
    ).toBeInTheDocument();
    finishOld?.({ rate: 21.05, rateDate: "2026-11-19" });
    expect(screen.queryByText(/21.05 JPY/)).toBeNull();
    click("保存转账");
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(submittedForm(action).get("transferTargetAmount")).toBe("700.00");
  });
});

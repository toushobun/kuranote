import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  accountHolderOptionsFixture,
  accountPlaceholderHolderOptionsFixture,
  createMemberAccountHolder,
  createPlaceholderAccountHolder,
  inactiveAccountHolderOptionFixture,
} from "test/mocks/accountHolders";
import { bankAccountFixture } from "test/mocks/accounts";
import type { Account } from "types/accounts";

import { AccountForm } from "./AccountForm";

function renderAccountForm(
  props: Partial<ComponentProps<typeof AccountForm>> = {},
) {
  const action = vi.fn(async (formData: FormData) => {
    void formData;
  });
  render(
    <AccountForm
      action={action}
      defaultCurrency="JPY"
      holderOptions={accountHolderOptionsFixture}
      placeholderHolderOptions={accountPlaceholderHolderOptionsFixture}
      {...props}
    />,
  );
  return { action };
}

function getPreview() {
  return screen.getByTestId("account-form-preview");
}

function fillCreditCard() {
  fireEvent.change(screen.getByLabelText(/账户名称/), {
    target: { value: "楽天カード" },
  });
  fireEvent.click(screen.getByRole("radio", { name: "信用卡" }));
  fireEvent.change(screen.getByLabelText("初始金额"), {
    target: { value: "-12800" },
  });
  fireEvent.click(screen.getByRole("checkbox", { name: "妻子" }));
}

describe("AccountForm", () => {
  it("初始状态的预览显示占位名称与当前货币的 0 余额", () => {
    renderAccountForm();

    const preview = within(getPreview());
    expect(preview.getByText("账户名称")).toBeInTheDocument();
    expect(preview.getByText("未设置持有人")).toBeInTheDocument();
    expect(preview.getByText("¥0")).toBeInTheDocument();
  });

  it("预览随名称、类型、金额与持有人实时更新", () => {
    renderAccountForm();

    fillCreditCard();

    const preview = within(getPreview());
    expect(preview.getByText("楽天カード")).toBeInTheDocument();
    expect(preview.getByText("信用卡")).toBeInTheDocument();
    expect(preview.getByText("-¥12,800")).toBeInTheDocument();
    expect(preview.getByText("妻子")).toBeInTheDocument();
  });

  it("切换货币时预览与金额符号一起改变", () => {
    renderAccountForm();

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "货币" }));
    fireEvent.click(screen.getByRole("option", { name: "USD 美元" }));

    expect(within(getPreview()).getByText("$0.00")).toBeInTheDocument();
    expect(screen.getByLabelText("初始金额")).toHaveAttribute(
      "data-amount-currency",
      "USD",
    );
  });

  it("提交名称、类型、货币、初始金额与持有人", async () => {
    const { action } = renderAccountForm();

    fillCreditCard();
    fireEvent.click(screen.getByRole("button", { name: "保存账户" }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const formData = action.mock.calls[0]?.[0];
    expect(formData?.get("name")).toBe("楽天カード");
    expect(formData?.get("type")).toBe("credit_card");
    expect(formData?.get("currency")).toBe("JPY");
    expect(formData?.get("initialBalance")).toBe("-12800");
    expect(formData?.getAll("holderUserIds")).toEqual([
      accountHolderOptionsFixture[1]?.user_id,
    ]);
    expect(formData?.get("holderPlaceholderId")).toBeNull();
    expect(formData?.get("returnTo")).toBeNull();
  });

  it("未选择账户类型时由浏览器校验拦截提交", () => {
    renderAccountForm();

    expect(screen.getByRole("radio", { name: "现金" })).toBeRequired();
  });

  it("没有 returnTo 时取消回到账户管理", () => {
    renderAccountForm();
    expect(screen.getByRole("link", { name: "取消" })).toHaveAttribute(
      "href",
      "/accounts",
    );
  });

  it("带 returnTo 时取消回到来源页并随表单提交", async () => {
    const returnTo = "/transactions/new?method=standard";
    const { action } = renderAccountForm({ returnTo });

    expect(screen.getByRole("link", { name: "取消" })).toHaveAttribute(
      "href",
      returnTo,
    );
    fillCreditCard();
    fireEvent.click(screen.getByRole("button", { name: "保存账户" }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(action.mock.calls[0]?.[0].get("returnTo")).toBe(returnTo);
  });

  it("提交中按钮显示加载且不可再次点击", () => {
    renderAccountForm({ pending: true });

    expect(screen.getByLabelText("保存中").closest("button")).toBeDisabled();
  });
});

const [me, wife] = accountHolderOptionsFixture;

function renderEditForm(account: Partial<Account> = {}) {
  return renderAccountForm({ account: { ...bankAccountFixture, ...account } });
}

async function submitEditForm(
  action: ReturnType<typeof renderEditForm>["action"],
) {
  fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
  await waitFor(() => expect(action).toHaveBeenCalledOnce());
  return action.mock.calls[0]![0];
}

describe("AccountForm 编辑", () => {
  it("以当前值填入表单与预览，余额为当前余额", () => {
    renderEditForm();

    expect(screen.getByLabelText(/账户名称/)).toHaveValue("三菱UFJ银行");
    expect(screen.getByRole("radio", { name: "银行卡" })).toBeChecked();
    expect(screen.getByLabelText("当前余额")).toHaveValue("85000");
    expect(screen.getByRole("checkbox", { name: "我" })).toBeChecked();
    const preview = within(getPreview());
    expect(preview.getByText("三菱UFJ银行")).toBeInTheDocument();
    expect(preview.getByText("¥85,000")).toBeInTheDocument();
    expect(preview.getByText("我")).toBeInTheDocument();
  });

  it("余额未变化时不提交目标余额，也不显示备注", async () => {
    const { action } = renderEditForm();

    expect(screen.queryByLabelText("余额调整备注")).toBeNull();
    const formData = await submitEditForm(action);
    expect(formData.get("accountId")).toBe(bankAccountFixture.id);
    expect(formData.get("name")).toBe("三菱UFJ银行");
    expect(formData.get("type")).toBe("bank");
    expect(formData.get("currency")).toBe("JPY");
    expect(formData.has("targetBalance")).toBe(false);
    expect(formData.has("initialBalance")).toBe(false);
    expect(formData.getAll("holderUserIds")).toEqual([me!.user_id]);
  });

  it("修改余额后显示增减差值，提交目标余额与备注", async () => {
    const { action } = renderEditForm();

    fireEvent.change(screen.getByLabelText("当前余额"), {
      target: { value: "80000" },
    });
    expect(screen.getByText("将减少 ¥5,000")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("余额调整备注"), {
      target: { value: "对账" },
    });

    const formData = await submitEditForm(action);
    expect(formData.get("targetBalance")).toBe("80000");
    expect(formData.get("balanceAdjustmentNote")).toBe("对账");
  });

  it("恢复原余额后隐藏差值与备注", () => {
    renderEditForm();
    const balance = screen.getByLabelText("当前余额");

    fireEvent.change(balance, { target: { value: "90000" } });
    expect(screen.getByText("将增加 ¥5,000")).toBeInTheDocument();
    fireEvent.change(balance, { target: { value: "85000" } });

    expect(screen.queryByText(/将增加/)).toBeNull();
    expect(screen.queryByLabelText("余额调整备注")).toBeNull();
  });

  it("无效余额时提示并禁止保存", () => {
    renderEditForm();

    fireEvent.change(screen.getByLabelText("当前余额"), {
      target: { value: "12.345" },
    });

    expect(
      screen.getByText("请输入最多两位小数的有效余额。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存修改" })).toBeDisabled();
  });

  it("已有交易时禁用币种并说明原因，仍提交当前币种", async () => {
    const { action } = renderEditForm({ has_transactions: true });

    expect(screen.getByRole("combobox", { name: "货币" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(
      screen.getByText("该账户已有交易记录，不能修改币种。"),
    ).toBeInTheDocument();
    const formData = await submitEditForm(action);
    expect(formData.getAll("currency")).toEqual(["JPY"]);
  });

  it("账户币种不在常见清单里时也显示为当前币种", () => {
    renderEditForm({ currency: "HKD" });

    expect(screen.getByRole("combobox", { name: "货币" })).toHaveTextContent(
      "HKD",
    );
  });

  it("没有交易时可以修改币种且不显示说明", () => {
    renderEditForm();

    expect(screen.getByRole("combobox", { name: "货币" })).not.toHaveAttribute(
      "aria-disabled",
    );
    expect(screen.queryByText("该账户已有交易记录，不能修改币种。")).toBeNull();
  });

  it("非活跃成员持有人选中且不可操作，不随表单提交", async () => {
    const { action } = renderEditForm({
      holders: [createMemberAccountHolder(inactiveAccountHolderOptionFixture)],
    });

    const preserved = screen.getByRole("checkbox", {
      name: "前成员（非活跃）",
    });
    expect(preserved).toBeChecked();
    expect(preserved).toBeDisabled();
    expect(within(getPreview()).getByText("前成员")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "妻子" }));

    const formData = await submitEditForm(action);
    expect(formData.getAll("holderUserIds")).toEqual([wife!.user_id]);
  });

  describe("占位持有人", () => {
    const placeholderHolder = createPlaceholderAccountHolder();

    it("不改持有人直接保存时仍提交该占位 ID", async () => {
      const { action } = renderEditForm({ holders: [placeholderHolder] });

      expect(screen.getByRole("checkbox", { name: "奶奶" })).toBeChecked();
      const formData = await submitEditForm(action);
      expect(formData.get("holderPlaceholderId")).toBe(
        placeholderHolder.placeholder_id,
      );
      expect(formData.getAll("holderUserIds")).toEqual([]);
    });

    it("当前占位暂不在候选中时仍补入选项并原样提交", async () => {
      const holder = createPlaceholderAccountHolder({
        display_name: "外婆",
        placeholder_id: "00000000-0000-4000-8000-000000000062",
      });
      const { action } = renderEditForm({ holders: [holder] });

      expect(screen.getByRole("checkbox", { name: "外婆" })).toBeChecked();
      const formData = await submitEditForm(action);
      expect(formData.get("holderPlaceholderId")).toBe(holder.placeholder_id);
    });

    it("可以从占位改为真实成员或无持有人", async () => {
      const { action } = renderEditForm({ holders: [placeholderHolder] });

      fireEvent.click(screen.getByRole("checkbox", { name: "妻子" }));
      expect(screen.getByRole("checkbox", { name: "奶奶" })).not.toBeChecked();
      fireEvent.click(screen.getByRole("checkbox", { name: "妻子" }));

      const formData = await submitEditForm(action);
      expect(formData.get("holderPlaceholderId")).toBeNull();
      expect(formData.getAll("holderUserIds")).toEqual([]);
    });
  });

  it("取消回到账户管理", () => {
    renderEditForm();

    expect(screen.getByRole("link", { name: "取消" })).toHaveAttribute(
      "href",
      "/accounts",
    );
  });
});

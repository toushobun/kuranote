import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ledgerFeatureSettingMessages } from "config/ledgerMessages";

import { LedgerMultiAccountPaymentSetting } from "./LedgerMultiAccountPaymentSetting";

const messages = ledgerFeatureSettingMessages.multiAccountPayment;

describe("LedgerMultiAccountPaymentSetting", () => {
  it("开启状态说明已有多账户记录时无法关闭，并允许关闭开关", () => {
    const onChange = vi.fn();
    render(<LedgerMultiAccountPaymentSetting enabled onChange={onChange} />);

    expect(screen.getByText(messages.enabledDescription)).toBeInTheDocument();
    const toggle = screen.getByRole("switch", { name: messages.switchLabel });
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("关闭状态说明每笔记录只能选择一个付款账户", () => {
    const onChange = vi.fn();
    render(
      <LedgerMultiAccountPaymentSetting enabled={false} onChange={onChange} />,
    );

    expect(screen.getByText(messages.disabledDescription)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: messages.switchLabel }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("开启说明传入 null 时不显示（创建账本向导）", () => {
    render(
      <LedgerMultiAccountPaymentSetting
        enabled
        enabledDescription={null}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByText(messages.enabledDescription),
    ).not.toBeInTheDocument();
  });

  it("普通成员只能查看设置", () => {
    render(
      <LedgerMultiAccountPaymentSetting
        canEdit={false}
        enabled={false}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("switch", { name: messages.switchLabel }),
    ).toBeDisabled();
    expect(
      screen.getByText(ledgerFeatureSettingMessages.canEditOnly),
    ).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ledgerFeatureSettingMessages } from "config/ledgerMessages";

import { LedgerFeatureSwitchCard } from "./LedgerFeatureSwitchCard";

const baseProps = {
  description: "功能说明",
  icon: <span />,
  onChange: vi.fn(),
  sectionTitle: "功能分区",
  switchLabel: "启用功能",
};

describe("LedgerFeatureSwitchCard", () => {
  it("显示分区标题、说明与补充内容，并回传开关状态", () => {
    const onChange = vi.fn();
    render(
      <LedgerFeatureSwitchCard {...baseProps} enabled onChange={onChange}>
        <p>补充内容</p>
      </LedgerFeatureSwitchCard>,
    );

    expect(
      screen.getByRole("heading", { name: "功能分区" }),
    ).toBeInTheDocument();
    expect(screen.getByText("功能说明")).toBeInTheDocument();
    expect(screen.getByText("补充内容")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: "启用功能" }));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("不可编辑时禁用开关并提示权限", () => {
    render(
      <LedgerFeatureSwitchCard
        {...baseProps}
        canEdit={false}
        enabled={false}
      />,
    );

    expect(screen.getByRole("switch", { name: "启用功能" })).toBeDisabled();
    expect(
      screen.getByText(ledgerFeatureSettingMessages.canEditOnly),
    ).toBeInTheDocument();
  });

  it("加载中只显示加载状态", () => {
    render(<LedgerFeatureSwitchCard {...baseProps} enabled state="loading" />);

    expect(screen.getByRole("status")).toHaveTextContent(
      ledgerFeatureSettingMessages.loading,
    );
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("错误时显示反馈并允许重试", () => {
    const onRetry = vi.fn();
    render(
      <LedgerFeatureSwitchCard
        {...baseProps}
        enabled={false}
        onRetry={onRetry}
        state="error"
      />,
    );

    expect(
      screen.getByText(ledgerFeatureSettingMessages.loadFailed),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: ledgerFeatureSettingMessages.retry }),
    );
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

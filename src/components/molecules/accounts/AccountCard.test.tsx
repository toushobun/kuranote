import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { afterEach, describe, expect, it, vi } from "vitest";

import { designTokens, theme } from "theme/theme";

import { AccountCard } from "./AccountCard";

afterEach(() => {
  cleanup();
});

const baseProps = {
  name: "三菱UFJ银行",
  type: "bank" as const,
  currency: "JPY",
  currentBalance: 85000,
  holders: [],
};

describe("AccountCard", () => {
  it("图标容器使用方圆角而不是被裸数字放大成整圆", () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <AccountCard {...baseProps} />
      </ThemeProvider>,
    );

    const icon = within(container).getByTestId("account-card-icon");
    expect(getComputedStyle(icon).borderRadius).toBe(
      `${designTokens.radius.sm}px`,
    );
  });

  it("显示账户名称", () => {
    const { container } = render(<AccountCard {...baseProps} />);

    expect(within(container).getByText("三菱UFJ银行")).toBeInTheDocument();
  });

  it("显示账户类型标签", () => {
    const { container } = render(<AccountCard {...baseProps} />);

    expect(within(container).getByText("银行卡")).toBeInTheDocument();
  });

  it("显示当前余额", () => {
    const { container } = render(<AccountCard {...baseProps} />);

    expect(within(container).getByText("¥85,000")).toBeInTheDocument();
  });

  it("不显示初始余额", () => {
    const { container } = render(<AccountCard {...baseProps} />);

    expect(within(container).queryByText(/初始余额/)).toBeNull();
  });

  it("没有持有人时显示未设置", () => {
    const { container } = render(<AccountCard {...baseProps} />);

    expect(within(container).getByText("未设置持有人")).toBeInTheDocument();
  });

  it("有持有人时显示持有人名称", () => {
    const { container } = render(
      <AccountCard
        {...baseProps}
        holders={[
          {
            id: "holder-1",
            user_id: "user-1",
            display_name: "张三",
            email: "zhangsan@example.com",
            display_color: "sky",
            role: "owner",
            share_ratio: null,
          },
        ]}
      />,
    );

    expect(within(container).getByText(/张三/)).toBeInTheDocument();
  });

  it("渲染自定义 actions 插槽", () => {
    const { container } = render(
      <AccountCard
        {...baseProps}
        actions={<button type="button">编辑</button>}
      />,
    );

    expect(
      within(container).getByRole("button", { name: "编辑" }),
    ).toBeInTheDocument();
  });

  it("点击卡片时触发回调", () => {
    const onClick = vi.fn();
    const { container } = render(
      <AccountCard {...baseProps} onClick={onClick} />,
    );

    fireEvent.click(within(container).getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

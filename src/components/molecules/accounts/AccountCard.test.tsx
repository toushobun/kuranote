import { cleanup, render, within } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { afterEach, describe, expect, it } from "vitest";

import { designTokens, theme } from "theme/theme";

import { createPlaceholderAccountHolder } from "test/mocks/accountHolders";

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

  it("类型为 null 时不显示类型标签", () => {
    const { container } = render(<AccountCard {...baseProps} type={null} />);

    expect(within(container).queryByText("银行卡")).toBeNull();
    expect(within(container).queryByText("其他")).toBeNull();
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
            kind: "member" as const,
            placeholder_id: null,
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

  it("占位持有人显示名字与待邀请标记，不显示为未设置持有人", () => {
    const { container } = render(
      <AccountCard
        {...baseProps}
        holders={[createPlaceholderAccountHolder()]}
      />,
    );

    expect(within(container).getByText("奶奶（待邀请）")).toBeInTheDocument();
    expect(within(container).queryByText("未设置持有人")).toBeNull();
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

  it("传入 href 时整张卡片是链接", () => {
    const href = "/accounts/account-1/edit";
    const { container } = render(<AccountCard {...baseProps} href={href} />);

    expect(within(container).getByRole("link")).toHaveAttribute("href", href);
  });
});

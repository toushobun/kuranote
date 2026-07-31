import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { IconBadge } from "atoms/ui/IconBadge";

import { PageHeader } from "./PageHeader";

afterEach(() => {
  cleanup();
});

describe("PageHeader", () => {
  it("显示标题", () => {
    const { container } = render(<PageHeader title="账户" />);

    expect(
      within(container).getByRole("heading", { name: "账户" }),
    ).toBeInTheDocument();
  });

  it("显示副标题和操作区域", () => {
    const { container } = render(
      <PageHeader
        title="账户"
        subtitle="账户说明"
        action={<Button>新增账户</Button>}
      />,
    );

    expect(within(container).getByText("账户说明")).toBeInTheDocument();
    expect(
      within(container).getByRole("button", { name: "新增账户" }),
    ).toBeInTheDocument();
  });

  it("显示 ReactNode 副标题", () => {
    const { container } = render(
      <PageHeader
        title="统计"
        subtitle={
          <Stack spacing={0.5}>
            <span>当前账本：家庭账本</span>
            <Typography color="text.secondary" variant="body2">
              按月份整理收支、分类和商家，让家庭账本一眼看清。
            </Typography>
          </Stack>
        }
      />,
    );

    expect(
      within(container).getByText("当前账本：家庭账本"),
    ).toBeInTheDocument();
    expect(
      within(container).getByText(
        "按月份整理收支、分类和商家，让家庭账本一眼看清。",
      ),
    ).toBeInTheDocument();
  });

  it("显示前置图标区域", () => {
    const { container } = render(
      <PageHeader
        title="账户"
        leading={<IconBadge label="账户图标">账</IconBadge>}
      />,
    );

    expect(
      within(container).getByRole("img", { name: "账户图标" }),
    ).toBeInTheDocument();
  });
});

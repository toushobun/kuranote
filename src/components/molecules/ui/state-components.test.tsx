import Button from "@mui/material/Button";
import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FormActions } from "./FormActions";
import { LoadingState } from "./LoadingState";
import { ResultFeedback } from "./ResultFeedback";
import { SectionCard } from "./SectionCard";

afterEach(() => {
  cleanup();
});

describe("SectionCard", () => {
  it("显示内容", () => {
    const { container } = render(<SectionCard>区块内容</SectionCard>);

    expect(within(container).getByText("区块内容")).toBeInTheDocument();
  });
});

describe("ResultFeedback", () => {
  it("显示空状态标题和说明", () => {
    const { container } = render(
      <ResultFeedback
        surface="card"
        variant="empty"
        title="还没有账户"
        message="请先新增一个账户。"
      />,
    );

    expect(within(container).getByText("还没有账户")).toBeInTheDocument();
    expect(
      within(container).getByText("请先新增一个账户。"),
    ).toBeInTheDocument();
  });

  it("显示错误状态和操作区域", () => {
    const { container } = render(
      <ResultFeedback
        surface="card"
        variant="error"
        title="账户操作失败"
        message="账户新增失败。"
        action={<Button>重试</Button>}
      />,
    );

    expect(within(container).getByRole("alert")).toBeInTheDocument();
    expect(within(container).getByText("账户操作失败")).toBeInTheDocument();
    expect(within(container).getByText("账户新增失败。")).toBeInTheDocument();
    expect(
      within(container).getByRole("button", { name: "重试" }),
    ).toBeInTheDocument();
  });
});

describe("LoadingState", () => {
  it("以 status 显示读取状态", () => {
    const { container } = render(<LoadingState />);

    expect(within(container).getByRole("status")).toBeInTheDocument();
    expect(within(container).getByText("读取中")).toBeInTheDocument();
  });
});

describe("FormActions", () => {
  it("显示操作按钮", () => {
    const { container } = render(
      <FormActions>
        <Button>保存</Button>
      </FormActions>,
    );

    expect(
      within(container).getByRole("button", { name: "保存" }),
    ).toBeInTheDocument();
  });
});

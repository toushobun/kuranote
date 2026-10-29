import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StepProgress } from "./StepProgress";

const steps = ["基本信息", "账户", "商家", "功能", "确认", "邀请"];

function renderProgress(currentStep: number) {
  render(
    <StepProgress currentStep={currentStep} label="创建进度" steps={steps} />,
  );
  return within(screen.getByRole("list", { name: "创建进度" })).getAllByRole(
    "listitem",
  );
}

describe("StepProgress", () => {
  it("按顺序显示全部步骤标签", () => {
    const items = renderProgress(1);

    expect(items).toHaveLength(6);
    items.forEach((item, index) => {
      expect(item).toHaveTextContent(steps[index]);
    });
  });

  it("当前步骤之前为已完成，之后为未开始", () => {
    const items = renderProgress(3);

    expect(items.map((item) => item.dataset.status)).toEqual([
      "completed",
      "completed",
      "current",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
    expect(items[0]).toHaveTextContent("基本信息（已完成）");
    expect(items[3]).toHaveTextContent("功能（未开始）");
  });

  it("只有当前步骤标记 aria-current，并且标签不附加状态说明", () => {
    const items = renderProgress(3);

    expect(items[2]).toHaveAttribute("aria-current", "step");
    expect(items[2]).toHaveTextContent(/^3商家$/);
    expect(
      items.filter((item) => item.hasAttribute("aria-current")),
    ).toHaveLength(1);
  });

  it("已完成步骤显示对勾，其他步骤显示序号", () => {
    const items = renderProgress(2);

    expect(
      within(items[0]).getByTestId("CheckRoundedIcon"),
    ).toBeInTheDocument();
    expect(items[1]).toHaveTextContent(/^2账户$/);
    expect(within(items[5]).queryByTestId("CheckRoundedIcon")).toBeNull();
  });
});

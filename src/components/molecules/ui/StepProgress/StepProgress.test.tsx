import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
  it("仅可点击指定步骤，返回修改时保留显式完成状态", () => {
    const onStepClick = vi.fn();
    render(
      <StepProgress
        currentStep={2}
        label="修改进度"
        steps={["商家", "账户", "明细", "确认"]}
        completedSteps={[1, 2, 3]}
        clickableSteps={[1, 3, 4]}
        onStepClick={onStepClick}
      />,
    );
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((item) => item.dataset.status)).toEqual([
      "completed",
      "current",
      "completed",
      "upcoming",
    ]);
    fireEvent.click(screen.getByRole("button", { name: "明细" }));
    expect(onStepClick).toHaveBeenCalledWith(3);
    expect(
      screen.queryByRole("button", { name: "账户" }),
    ).not.toBeInTheDocument();
  });
  it("不传步骤点击回调时保持非按钮结构", () => {
    const items = renderProgress(2);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(items[1].children).toHaveLength(3);
    expect(items[1].lastElementChild?.tagName).toBe("SPAN");
  });
  describe("连线", () => {
    const flowSteps = ["商家", "账户", "明细", "确认"];
    function connectors(items: HTMLElement[]) {
      // 最后一步没有连线；每一步的第一个子元素是通往下一步的连线。
      return items
        .slice(0, -1)
        .map((item) =>
          getComputedStyle(item.firstElementChild!).backgroundColor ===
          "var(--user-theme-action-text)"
            ? "solid"
            : "muted",
        );
    }

    it("不传 completedSteps 时与创建账本向导一致，只有当前步骤之前的连线为实线", () => {
      expect(connectors(renderProgress(3))).toEqual([
        "solid",
        "solid",
        "muted",
        "muted",
        "muted",
      ]);
    });

    it("连线任一侧步骤已完成即为实线，与当前步骤无关", () => {
      render(
        <StepProgress
          currentStep={1}
          label="记账进度"
          steps={flowSteps}
          completedSteps={[2, 3]}
        />,
      );
      const items = within(screen.getByRole("list")).getAllByRole("listitem");
      expect(connectors(items)).toEqual(["solid", "solid", "solid"]);
    });

    it("当前步骤两侧都未完成时连线保持浅色", () => {
      render(
        <StepProgress
          currentStep={3}
          label="记账进度"
          steps={flowSteps}
          completedSteps={[1]}
        />,
      );
      const items = within(screen.getByRole("list")).getAllByRole("listitem");
      expect(connectors(items)).toEqual(["solid", "muted", "muted"]);
    });
  });

  describe("第二行文字", () => {
    it("有值的步骤在步骤名下方显示第二行，空值不显示", () => {
      render(
        <StepProgress
          currentStep={3}
          label="记账进度"
          steps={["商家", "账户", "明细", "确认"]}
          stepDetails={["7-Eleven", "PayPay"]}
          completedSteps={[1, 2]}
          clickableSteps={[1, 2, 3, 4]}
          onStepClick={() => {}}
        />,
      );
      const items = within(screen.getByRole("list")).getAllByRole("listitem");
      expect(items.map((item) => item.textContent)).toEqual([
        "商家（已完成）7-Eleven",
        "账户（已完成）PayPay",
        "3明细",
        "4确认（未开始）",
      ]);
      expect(screen.getByRole("button", { name: "商家" })).toContainElement(
        screen.getByText("7-Eleven"),
      );
    });
  });
});

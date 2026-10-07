import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WizardActionBar } from "./WizardActionBar";

describe("WizardActionBar", () => {
  it("只有下一步时显示单个按钮", () => {
    const onNext = vi.fn();
    render(<WizardActionBar next={{ label: "下一步", onClick: onNext }} />);

    expect(screen.getAllByRole("button")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("显示上一步、下一步与跳过此步并分别回调", () => {
    const onPrevious = vi.fn();
    const onSkip = vi.fn();
    render(
      <WizardActionBar
        next={{ label: "下一步", onClick: vi.fn() }}
        previous={{ label: "上一步", onClick: onPrevious }}
        skip={{ label: "跳过此步", onClick: onSkip }}
      />,
    );

    expect(
      screen.getAllByRole("button").map((button) => button.textContent),
    ).toEqual(["跳过此步", "上一步", "下一步"]);
    fireEvent.click(screen.getByRole("button", { name: "上一步" }));
    fireEvent.click(screen.getByRole("button", { name: "跳过此步" }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("处理中时下一步显示加载状态并禁用", () => {
    render(
      <WizardActionBar
        next={{ label: "下一步", loading: true, loadingLabel: "保存中" }}
      />,
    );

    const button = screen.getByRole("button", { name: "保存中" });
    expect(button).toBeDisabled();
    expect(
      screen.getByRole("progressbar", { name: "保存中" }),
    ).toBeInTheDocument();
  });

  it("可以作为外部表单的提交按钮", () => {
    render(
      <WizardActionBar
        next={{ form: "wizard-form", label: "下一步", type: "submit" }}
      />,
    );

    const button = screen.getByRole("button", { name: "下一步" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("form", "wizard-form");
  });

  it("disabled 时对应按钮不可点击", () => {
    render(
      <WizardActionBar
        next={{ disabled: true, label: "下一步" }}
        previous={{ disabled: true, label: "上一步", onClick: vi.fn() }}
      />,
    );

    expect(screen.getByRole("button", { name: "下一步" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "上一步" })).toBeDisabled();
  });
});

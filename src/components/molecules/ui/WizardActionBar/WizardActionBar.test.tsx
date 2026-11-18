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

  it("显示上一步与下一步并回调", () => {
    const onPrevious = vi.fn();
    render(
      <WizardActionBar
        next={{ label: "下一步", onClick: vi.fn() }}
        previous={{ label: "上一步", onClick: onPrevious }}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "上一步" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "上一步" }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it("处理中时下一步保留加载状态、名称并禁用", async () => {
    render(
      <WizardActionBar
        next={{ label: "下一步", loading: true, loadingLabel: "保存中…" }}
      />,
    );

    const button = screen.getByRole("button", { name: "保存中…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(
      await screen.findByRole("progressbar", { name: "保存中…" }),
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

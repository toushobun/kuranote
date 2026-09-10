import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CategoryDialogActions } from "./CategoryDialogActions";

describe("CategoryDialogActions", () => {
  it("提交关联的外部表单，取消只调用回调", () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <>
        <form id="category-form" onSubmit={onSubmit} />
        <CategoryDialogActions
          form="category-form"
          onCancel={onCancel}
          submitLabel="保存"
        />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("禁用提交时仍能取消，附加操作独立于取消和提交行", () => {
    const onCancel = vi.fn();
    render(
      <CategoryDialogActions disabled onCancel={onCancel} submitLabel="保存">
        <button type="button">归档该分类</button>
      </CategoryDialogActions>,
    );
    const cancel = screen.getByRole("button", { name: "取消" });
    const submit = screen.getByRole("button", { name: "保存" });
    const archive = screen.getByRole("button", { name: "归档该分类" });
    expect(submit).toBeDisabled();
    expect(cancel).toBeEnabled();
    expect(cancel.parentElement).toBe(submit.parentElement);
    expect(archive.parentElement).toBe(cancel.parentElement?.parentElement);
    fireEvent.click(cancel);
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

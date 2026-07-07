import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AccountHolderCheckboxGroup } from "./AccountHolderCheckboxGroup";

afterEach(() => {
  cleanup();
});

const activeHolder = {
  user_id: "00000000-0000-4000-8000-000000000001",
  display_name: "淞文",
  email: "songwen@example.com",
};

const preservedHolder = {
  user_id: "00000000-0000-4000-8000-000000000002",
  display_name: "家人",
  email: "family@example.com",
};

describe("AccountHolderCheckboxGroup", () => {
  it("显示可选持有人", () => {
    const { container } = render(
      <AccountHolderCheckboxGroup holderOptions={[activeHolder]} />,
    );

    expect(within(container).getByLabelText("淞文")).toBeInTheDocument();
  });

  it("胶囊选项支持多选并提交持有人", () => {
    const { container } = render(
      <form>
        <AccountHolderCheckboxGroup
          holderOptions={[activeHolder, preservedHolder]}
        />
      </form>,
    );
    const activeCheckbox = within(container).getByLabelText("淞文");
    const familyCheckbox = within(container).getByLabelText("家人");

    fireEvent.click(activeCheckbox);
    fireEvent.click(familyCheckbox);

    const form = container.querySelector("form");
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("持有人测试表单未渲染。");
    }

    expect(new FormData(form).getAll("holderUserIds")).toEqual([
      activeHolder.user_id,
      preservedHolder.user_id,
    ]);
  });

  it("非活跃持有人禁用显示，但保存时继续提交", () => {
    const { container } = render(
      <form>
        <AccountHolderCheckboxGroup
          holderOptions={[activeHolder]}
          preservedHolderOptions={[preservedHolder]}
        />
      </form>,
    );

    const preservedCheckbox =
      within(container).getByLabelText("家人（非活跃，保存时保留）");
    const formData = new FormData(container.querySelector("form")!);

    expect(preservedCheckbox).toBeDisabled();
    expect(formData.getAll("holderUserIds")).toContain(preservedHolder.user_id);
  });
});

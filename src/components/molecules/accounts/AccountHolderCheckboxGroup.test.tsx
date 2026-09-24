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

  it("胶囊选项最多只能选中一个并提交持有人", () => {
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
      preservedHolder.user_id,
    ]);
    expect(activeCheckbox).not.toBeChecked();
    expect(familyCheckbox).toBeChecked();
  });

  it("再次点击已选中项可以取消选择", () => {
    const { container } = render(
      <form>
        <AccountHolderCheckboxGroup holderOptions={[activeHolder]} />
      </form>,
    );
    const activeCheckbox = within(container).getByLabelText("淞文");

    fireEvent.click(activeCheckbox);
    expect(activeCheckbox).toBeChecked();

    fireEvent.click(activeCheckbox);
    expect(activeCheckbox).not.toBeChecked();

    const form = container.querySelector("form");
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("持有人测试表单未渲染。");
    }
    expect(new FormData(form).getAll("holderUserIds")).toEqual([]);
  });

  it("非活跃持有人禁用显示，且不通过表单提交（由数据库保存时自动保留）", () => {
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
    expect(formData.getAll("holderUserIds")).not.toContain(
      preservedHolder.user_id,
    );
  });

  it("存在非活跃持有人时，仍可以选择活跃持有人", () => {
    const { container } = render(
      <form>
        <AccountHolderCheckboxGroup
          holderOptions={[activeHolder]}
          preservedHolderOptions={[preservedHolder]}
        />
      </form>,
    );

    const activeCheckbox = within(container).getByLabelText("淞文");
    expect(activeCheckbox).not.toBeDisabled();

    fireEvent.click(activeCheckbox);

    const formData = new FormData(container.querySelector("form")!);
    expect(formData.getAll("holderUserIds")).toEqual([activeHolder.user_id]);
  });

  describe("三态持有人", () => {
    const placeholder = {
      placeholder_id: "placeholder-1",
      display_name: "奶奶",
    };

    function renderInForm(
      props: Partial<Parameters<typeof AccountHolderCheckboxGroup>[0]> = {},
    ) {
      const { container } = render(
        <form>
          <AccountHolderCheckboxGroup
            holderOptions={[activeHolder]}
            placeholderOptions={[placeholder]}
            {...props}
          />
        </form>,
      );
      const form = container.querySelector("form")!;
      return {
        container,
        formValues: () => {
          const formData = new FormData(form);
          return {
            placeholderIds: formData.getAll("holderPlaceholderId"),
            userIds: formData.getAll("holderUserIds"),
          };
        },
      };
    }

    it("待邀请成员与真实成员分组显示并带有区分标记", () => {
      const { container } = renderInForm();

      expect(within(container).getByText("待邀请成员")).toBeInTheDocument();
      expect(
        within(container).getByLabelText("奶奶（待邀请）"),
      ).toBeInTheDocument();
      expect(within(container).getByLabelText("淞文")).toBeInTheDocument();
    });

    it("可以在成员、待邀请成员和无持有人之间切换，且只提交一个", () => {
      const { container, formValues } = renderInForm();
      const member = within(container).getByLabelText("淞文");
      const pending = within(container).getByLabelText("奶奶（待邀请）");

      fireEvent.click(member);
      expect(formValues()).toEqual({
        placeholderIds: [],
        userIds: [activeHolder.user_id],
      });

      fireEvent.click(pending);
      expect(member).not.toBeChecked();
      expect(formValues()).toEqual({
        placeholderIds: [placeholder.placeholder_id],
        userIds: [],
      });

      fireEvent.click(pending);
      expect(formValues()).toEqual({ placeholderIds: [], userIds: [] });
    });

    it("初始选中占位持有人时直接提交该占位 ID", () => {
      const { container, formValues } = renderInForm({
        selectedPlaceholderId: placeholder.placeholder_id,
      });

      expect(within(container).getByLabelText("奶奶（待邀请）")).toBeChecked();
      expect(formValues()).toEqual({
        placeholderIds: [placeholder.placeholder_id],
        userIds: [],
      });
    });

    it("没有待邀请成员时不显示分组", () => {
      const { container } = renderInForm({ placeholderOptions: [] });

      expect(
        within(container).queryByText("待邀请成员"),
      ).not.toBeInTheDocument();
    });
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  accountHolderOptionsFixture,
  accountPlaceholderHolderOptionsFixture,
  inactiveAccountHolderOptionFixture,
} from "test/mocks/accountHolders";

import { AccountHolderAvatarPicker } from "./AccountHolderAvatarPicker";

const [me, wife] = accountHolderOptionsFixture;
const [grandma] = accountPlaceholderHolderOptionsFixture;

describe("AccountHolderAvatarPicker", () => {
  it("成员与待邀请成员分组显示", () => {
    render(
      <AccountHolderAvatarPicker
        holderOptions={accountHolderOptionsFixture}
        onChange={vi.fn()}
        placeholderOptions={accountPlaceholderHolderOptionsFixture}
        selection={null}
      />,
    );

    expect(screen.getByRole("group", { name: "持有人" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "待邀请成员" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "奶奶" })).toHaveAttribute(
      "name",
      "holderPlaceholderId",
    );
  });

  it("选中成员时只勾选该成员，再次点击取消选择", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <AccountHolderAvatarPicker
        holderOptions={accountHolderOptionsFixture}
        onChange={onChange}
        placeholderOptions={accountPlaceholderHolderOptionsFixture}
        selection={null}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "妻子" }));
    expect(onChange).toHaveBeenLastCalledWith({
      id: wife?.user_id,
      kind: "member",
    });

    rerender(
      <AccountHolderAvatarPicker
        holderOptions={accountHolderOptionsFixture}
        onChange={onChange}
        placeholderOptions={accountPlaceholderHolderOptionsFixture}
        selection={{ id: wife?.user_id ?? "", kind: "member" }}
      />,
    );
    expect(screen.getByRole("checkbox", { name: "妻子" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "我" })).not.toBeChecked();

    fireEvent.click(screen.getByRole("checkbox", { name: "妻子" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("从成员切换到待邀请成员", () => {
    const onChange = vi.fn();
    render(
      <AccountHolderAvatarPicker
        holderOptions={accountHolderOptionsFixture}
        onChange={onChange}
        placeholderOptions={accountPlaceholderHolderOptionsFixture}
        selection={{ id: me?.user_id ?? "", kind: "member" }}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "奶奶" }));

    expect(onChange).toHaveBeenCalledWith({
      id: grandma?.placeholder_id,
      kind: "placeholder",
    });
  });

  it("非活跃成员持有人显示为选中且不可操作，不带提交名", () => {
    const onChange = vi.fn();
    render(
      <AccountHolderAvatarPicker
        holderOptions={accountHolderOptionsFixture}
        onChange={onChange}
        preservedHolderOptions={[inactiveAccountHolderOptionFixture]}
        selection={null}
      />,
    );

    const preserved = screen.getByRole("checkbox", {
      name: "前成员（非活跃）",
    });
    expect(preserved).toBeChecked();
    expect(preserved).toBeDisabled();
    expect(preserved).not.toHaveAttribute("name");
    fireEvent.click(preserved);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("只有非活跃成员持有人时也显示成员分组", () => {
    render(
      <AccountHolderAvatarPicker
        holderOptions={[]}
        onChange={vi.fn()}
        preservedHolderOptions={[inactiveAccountHolderOptionFixture]}
        selection={null}
      />,
    );

    expect(screen.getByRole("group", { name: "持有人" })).toBeInTheDocument();
    expect(screen.queryByText("当前账本没有可选持有人。")).toBeNull();
  });

  it("没有任何候选时显示说明", () => {
    render(
      <AccountHolderAvatarPicker
        holderOptions={[]}
        onChange={vi.fn()}
        selection={null}
      />,
    );

    expect(screen.getByText("当前账本没有可选持有人。")).toBeInTheDocument();
  });
});

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GroupedIconPicker } from "./GroupedIconPicker";

const groups = [
  { id: "food", label: "餐饮", groupIcon: "🍴" },
  { id: "travel", label: "出行" },
];
const options = [
  { emoji: "☕", groupId: "food", label: "咖啡", keywords: ["饮品"] },
  { emoji: "🍜", groupId: "food", label: "面条", keywords: [] },
  { emoji: "🚃", groupId: "travel", label: "电车", keywords: [] },
];
const props = {
  groups,
  options,
  fieldLabel: "记录图标",
  helperText: "请选择一个图标",
  inputName: "recordIcon",
  value: "☕",
  onChange: () => {},
};
afterEach(cleanup);

describe("GroupedIconPicker", () => {
  it("小弹窗同时展示所有分组、数量和对应网格，不提供搜索或全部筛选", () => {
    render(<GroupedIconPicker {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
    const dialog = screen.getByRole("dialog", { name: "选择图标" });
    expect(dialog).not.toHaveClass("MuiDialog-paperFullScreen");
    expect(dialog).toHaveClass(
      "MuiDialog-paperFullWidth",
      "MuiDialog-paperWidthXs",
    );
    const sections = within(dialog).getAllByRole("region");
    expect(sections).toHaveLength(2);
    expect(within(sections[0]).getByText("🍴")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(sections[0]).toHaveAccessibleName("餐饮 2个图标");
    expect(sections[1]).toHaveAccessibleName("出行 1个图标");
    expect(within(sections[0]).getAllByRole("button")).toHaveLength(2);
    expect(
      within(sections[1]).getByRole("button", { name: "选择电车图标" }),
    ).toBeVisible();
    expect(within(dialog).queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("全部")).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "选择咖啡图标" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("草稿高亮只在确认后更新原生表单值，选择和确认不会提交外层表单", async () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    function Field() {
      const [value, setValue] = useState("☕");
      return (
        <form aria-label="记录" onSubmit={onSubmit}>
          <GroupedIconPicker
            {...props}
            value={value}
            onChange={(next) => {
              onChange(next);
              setValue(next);
            }}
          />
        </form>
      );
    }
    render(<Field />);
    const form = screen.getByRole("form", { name: "记录" }) as HTMLFormElement;
    fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
    fireEvent.click(screen.getByRole("button", { name: "选择电车图标" }));
    expect(
      screen.getByRole("button", { name: "选择电车图标" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "选择咖啡图标" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(new FormData(form).get("recordIcon")).toBe("☕");
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(onChange).toHaveBeenCalledExactlyOnceWith("🚃");
    expect(new FormData(form).get("recordIcon")).toBe("🚃");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each(["取消", "Escape"])(
    "通过 %s 关闭会丢弃草稿，重新打开使用最新值",
    async (method) => {
      const onChange = vi.fn();
      const { rerender } = render(
        <GroupedIconPicker {...props} onChange={onChange} />,
      );
      fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
      fireEvent.click(screen.getByRole("button", { name: "选择电车图标" }));
      if (method === "取消")
        fireEvent.click(screen.getByRole("button", { name: method }));
      else fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(onChange).not.toHaveBeenCalled();
      rerender(<GroupedIconPicker {...props} value="🍜" onChange={onChange} />);
      fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
      expect(
        screen.getByRole("button", { name: "选择面条图标" }),
      ).toHaveAttribute("aria-pressed", "true");
      expect(
        screen.getByRole("button", { name: "选择电车图标" }),
      ).toHaveAttribute("aria-pressed", "false");
    },
  );

  it("空分组显示零数量且不能确认无效选项", () => {
    render(<GroupedIconPicker {...props} options={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
    expect(screen.getByRole("heading", { name: "餐饮 0个图标" })).toBeVisible();
    expect(screen.getByRole("button", { name: "确定" })).toBeDisabled();
  });
});

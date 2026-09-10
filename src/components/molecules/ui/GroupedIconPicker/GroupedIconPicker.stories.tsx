import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { UserThemeProvider } from "theme/UserThemeProvider";
import { GroupedIconPicker } from "./GroupedIconPicker";

const meta = {
  title: "Molecules/UI/GroupedIconPicker",
  component: GroupedIconPicker,
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="storybook-grouped-icon-picker">
        <Story />
      </UserThemeProvider>
    ),
  ],
  args: {
    fieldLabel: "记录图标",
    helperText: "选择用于记录的图标。",
    inputName: "recordIcon",
    value: "☕",
    onChange: () => {},
    groups: [
      { id: "food", label: "餐饮" },
      { id: "travel", label: "出行" },
    ],
    options: [
      { emoji: "☕", groupId: "food", label: "咖啡", keywords: [] },
      { emoji: "🍜", groupId: "food", label: "面条", keywords: [] },
      { emoji: "🚃", groupId: "travel", label: "电车", keywords: [] },
    ],
  },
  render: function Picker(args) {
    const [value, setValue] = useState(args.value);
    return <GroupedIconPicker {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof GroupedIconPicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "图标字段" };
export const Grouped: Story = {
  name: "全屏分组与草稿选中态",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "选择图标" }),
    );
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole("dialog"),
    );
    await expect(
      dialog.getByRole("heading", { name: "餐饮 2个图标" }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "出行 1个图标" }),
    ).toBeVisible();
    await userEvent.click(dialog.getByRole("button", { name: "选择电车图标" }));
    await expect(
      dialog.getByRole("button", { name: "选择电车图标" }),
    ).toHaveAttribute("aria-pressed", "true");
  },
};
export const Empty: Story = {
  name: "空分组",
  args: { options: [] },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "选择图标" }),
    );
  },
};

export const UnavailableValue: Story = {
  name: "旧图标不可确认，重选有效图标",
  args: { value: "📁" },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "选择图标" }),
    );
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole("dialog"),
    );
    await expect(dialog.getByRole("button", { name: "确定" })).toBeDisabled();
  },
};

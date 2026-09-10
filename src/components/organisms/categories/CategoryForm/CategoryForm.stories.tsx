import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { UserThemeProvider } from "theme/UserThemeProvider";

import { CategoryForm } from "./CategoryForm";

const meta = {
  title: "Organisms/Categories/CategoryForm",
  component: CategoryForm,
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="storybook-category-dialog">
        <Story />
      </UserThemeProvider>
    ),
  ],
  args: {
    createCategoryAction: async () => {},
    parentOptions: [
      { id: "expense-food", name: "🍽️ 餐饮", type: "expense" },
      { id: "expense-transport", name: "🚃 交通", type: "expense" },
      { id: "income-main", name: "💰 收入", type: "income" },
    ],
  },
} satisfies Meta<typeof CategoryForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "新增分类弹窗",
};

export const IncomeChild: Story = {
  name: "新增收入小分类",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "新增分类" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("combobox", { name: "分类类型" }));
    await userEvent.click(body.getByRole("option", { name: "收入" }));
    await userEvent.click(body.getByRole("combobox", { name: "上级分类" }));
    await expect(
      body.queryByRole("option", { name: "🍽️ 餐饮" }),
    ).not.toBeInTheDocument();
    await userEvent.click(body.getByRole("option", { name: "💰 收入" }));
  },
};

export const SelectedIcon: Story = {
  name: "新增表单确认分类图标",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "新增分类" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("button", { name: "选择图标" }));
    const picker = within(body.getByRole("dialog", { name: "选择图标" }));
    await userEvent.click(picker.getByRole("button", { name: "选择面条图标" }));
    await userEvent.click(picker.getByRole("button", { name: "确定" }));
    await expect(body.getByLabelText("当前分类图标：🍜")).toBeVisible();
  },
};

export const EmptyParentOptions: Story = {
  name: "没有上级分类候选",
  args: {
    parentOptions: [],
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "新增分类" }),
    );
  },
};

export const DialogButtons: Story = {
  name: "新增弹窗等宽按钮",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "新增分类" }),
    );
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole("dialog"),
    );
    const cancel = dialog.getByRole("button", { name: "取消" });
    const submit = dialog.getByRole("button", { name: "新增分类" });
    await expect(cancel.getBoundingClientRect().width).toBeCloseTo(
      submit.getBoundingClientRect().width,
      0,
    );
    await expect(cancel.getBoundingClientRect().top).toBe(
      submit.getBoundingClientRect().top,
    );
  },
};

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

export const EmptyParentOptions: Story = {
  name: "没有上级分类候选",
  args: {
    parentOptions: [],
  },
};

export const DialogButtons: Story = {
  name: "弹窗等宽按钮与归档样式",
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

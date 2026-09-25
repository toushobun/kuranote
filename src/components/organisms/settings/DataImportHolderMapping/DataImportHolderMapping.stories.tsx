import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";

import { DataImportHolderMapping } from "./DataImportHolderMapping";

const meta = {
  title: "Organisms/Settings/DataImportHolderMapping",
  component: DataImportHolderMapping,
  args: {
    candidates: [
      { name: "小明", recordCount: 12, reason: "unmatched" },
      { name: "小红", recordCount: 3, reason: "unmatched" },
      { name: "重名", recordCount: 1, reason: "ambiguous" },
    ],
    members: [
      { displayName: "张三", email: "zhang@example.com", userId: "user-1" },
      { displayName: "重名", email: "a@example.com", userId: "user-2" },
      { displayName: "重名", email: "b@example.com", userId: "user-3" },
    ],
    onCancel: fn(),
    onConfirm: fn(),
    placeholders: [],
  },
} satisfies Meta<typeof DataImportHolderMapping>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "默认（含歧义姓名）",
};

export const SingleName: Story = {
  name: "仅一个未匹配姓名",
  args: {
    candidates: [{ name: "小明", recordCount: 1, reason: "unmatched" }],
  },
};

const placeholders = [
  { displayName: "奶奶", id: "00000000-0000-4000-8000-000000000051" },
  { displayName: "外婆", id: "00000000-0000-4000-8000-000000000052" },
];

export const WithPlaceholders: Story = {
  name: "含待邀请成员（非管理员，无新建选项）",
  args: {
    candidates: [
      { name: "奶奶", recordCount: 5, reason: "unmatched" },
      { name: "小明", recordCount: 12, reason: "unmatched" },
    ],
    placeholders,
  },
  // 展开「奶奶」的下拉：同名待邀请成员排在最前，但不会被自动选中。
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getAllByRole("combobox")[0]);
  },
};

export const ManagerCanCreate: Story = {
  name: "管理员：可新建待邀请成员（歧义姓名不提供）",
  args: {
    canCreatePlaceholders: true,
    placeholders,
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getAllByRole("combobox")[0]);
  },
};

export const ManagerCanCreateMobile: Story = {
  name: "管理员：可新建待邀请成员（移动端）",
  args: {
    canCreatePlaceholders: true,
    candidates: [
      { name: "小明", recordCount: 12, reason: "unmatched" },
      { name: "奶奶", recordCount: 5, reason: "unmatched" },
      { name: "重名", recordCount: 1, reason: "ambiguous" },
    ],
    placeholders,
  },
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
};

export const Disabled: Story = {
  name: "禁用",
  args: { disabled: true },
};

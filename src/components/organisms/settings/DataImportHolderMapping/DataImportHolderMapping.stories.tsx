import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

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

export const Disabled: Story = {
  name: "禁用",
  args: { disabled: true },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UnsavedChangesDialog } from "./UnsavedChangesDialog";

const meta: Meta<typeof UnsavedChangesDialog> = {
  component: UnsavedChangesDialog,
  title: "Molecules/UI/UnsavedChangesDialog",
};

export default meta;
type Story = StoryObj<typeof UnsavedChangesDialog>;

export const Default: Story = {
  name: "未保存确认",
  args: {
    onCancel: () => undefined,
    onDiscard: () => undefined,
    onSave: () => undefined,
    open: true,
  },
};

export const MultipleDirtyForms: Story = {
  name: "多个表单未保存（只继续或放弃）",
  args: { open: true, onCancel: () => undefined, onDiscard: () => undefined },
};

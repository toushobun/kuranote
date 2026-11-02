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

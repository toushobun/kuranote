import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DataTransferPlaceholderTemplate } from "./DataTransferPlaceholder";

const meta = {
  title: "Templates/Settings/DataTransferPlaceholderTemplate",
  component: DataTransferPlaceholderTemplate,
} satisfies Meta<typeof DataTransferPlaceholderTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Import: Story = {
  name: "数据导入 / 即将上线",
  args: { kind: "import" },
};

export const Export: Story = {
  name: "数据导出 / 即将上线",
  args: { kind: "export" },
};

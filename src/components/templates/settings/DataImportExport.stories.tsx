import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DataImportExportTemplate } from "./DataImportExport";

const meta = {
  title: "Templates/Settings/DataImportExportTemplate",
  component: DataImportExportTemplate,
} satisfies Meta<typeof DataImportExportTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "数据导入导出 / 入口页",
};

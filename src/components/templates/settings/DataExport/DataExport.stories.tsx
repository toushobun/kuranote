import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { dataExportErrorMessages } from "internal/dataExport";
import {
  createDataExportFixture,
  createEmptyDataExport,
} from "test/mocks/dataExport";
import type { DataExportAction } from "types/dataExport";
import { DataExportTemplate } from "./DataExport";

const exportAction: DataExportAction = async () => ({
  data: createDataExportFixture(),
});
const meta = {
  title: "Templates/Settings/DataExportTemplate",
  component: DataExportTemplate,
  args: { exportAction },
} satisfies Meta<typeof DataExportTemplate>;
export default meta;
type Story = StoryObj<typeof meta>;
const startExport: NonNullable<Story["play"]> = async ({ canvasElement }) => {
  await userEvent.click(
    within(canvasElement).getByRole("button", { name: "导出 xlsx" }),
  );
};
export const Default: Story = { name: "默认（可下载示例）" };
export const Exporting: Story = {
  name: "导出中",
  args: { exportAction: () => new Promise(() => {}) },
  play: startExport,
};
export const Failed: Story = {
  name: "导出失败",
  args: {
    exportAction: async () => ({ error: dataExportErrorMessages.exportFailed }),
  },
  play: startExport,
};
export const Empty: Story = {
  name: "空账本（可下载表头）",
  args: { exportAction: async () => ({ data: createEmptyDataExport() }) },
};

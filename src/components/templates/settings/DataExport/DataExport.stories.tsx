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
    within(canvasElement).getByRole("button", { name: "导出 Excel" }),
  );
};
export const Default: Story = { name: "默认（可下载示例）" };
export const IncludePhotos: Story = {
  name: "导出照片开关",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("switch", { name: "导出照片" }),
    );
  },
};
export const DownloadingPhotos: Story = {
  name: "正在准备照片",
  args: {
    exportAction: async () => ({
      data: {
        ...createDataExportFixture(),
        photos: [
          {
            recordId: "normal",
            sortOrder: 0,
            fullUrl: "https://example.com/photo.jpg",
          },
        ],
      },
    }),
  },
  play: async ({ canvasElement }) => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => new Promise<Response>(() => {});
    try {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole("switch", { name: "导出照片" }));
      await userEvent.click(canvas.getByRole("button", { name: "导出 Excel" }));
      await canvas.findByText("正在准备照片 0/1");
    } finally {
      globalThis.fetch = originalFetch;
    }
  },
};
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

export const SelectedRange: Story = {
  name: "已选日期及记录类型",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /日期区间/ }));
    await userEvent.click(canvas.getByRole("checkbox", { name: "转账" }));
  },
};

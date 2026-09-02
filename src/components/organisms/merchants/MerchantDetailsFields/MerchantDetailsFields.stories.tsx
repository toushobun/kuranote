import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import type { MerchantIconStateAction } from "types/merchants";

import { MerchantDetailsFields } from "./MerchantDetailsFields";

const fetchIconAction: MerchantIconStateAction = async () => ({
  iconUrl: "https://t2.gstatic.com/faviconV2?url=https://example.com",
  success: "网站图标已缓存",
});

const meta = {
  title: "Organisms/Merchants/MerchantDetailsFields",
  component: MerchantDetailsFields,
  args: {
    fetchIconAction,
    ledgerId: "ledger-1",
    name: "示例商家",
    note: "",
    onNameChange: () => {},
    onNoteChange: () => {},
    onWebsiteUrlChange: () => {},
    websiteUrl: "https://example.com",
  },
} satisfies Meta<typeof MerchantDetailsFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = { name: "获取前" };

export const Loading: Story = {
  args: {
    fetchIconAction: () => new Promise(() => {}),
  },
  name: "获取中",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "获取图标" }),
    );
    await expect(
      within(canvasElement).getByText("正在获取并验证网站图标"),
    ).toBeInTheDocument();
  },
};

export const Success: Story = {
  args: {
    initialIconUrl: "https://t2.gstatic.com/faviconV2?url=https://example.com",
  },
  name: "获取成功",
};

export const Error: Story = {
  args: {
    fetchIconAction: async () => ({
      error: "未能获取网站图标，请确认网址后重试。",
    }),
  },
  name: "获取失败",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "获取图标" }),
    );
    await expect(
      await within(canvasElement).findByText(
        "未能获取网站图标，请确认网址后重试。",
      ),
    ).toBeInTheDocument();
  },
};

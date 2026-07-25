import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import type { MerchantRow, MerchantStateAction } from "types/merchants";

import { MerchantsActionStateTemplate } from "./MerchantsActionState";

const merchants: MerchantRow[] = [
  {
    id: "00000000-0000-4000-8000-000000001001",
    name: "LIFE超市",
    website_url: "https://www.lifecorp.jp",
    icon_url: null,
    note: "常去的超市",
    sort_order: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    aliases: [
      {
        id: "alias-1",
        merchant_id: "00000000-0000-4000-8000-000000001001",
        alias: "来福",
        sort_order: 1,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001002",
    name: "Amazon",
    website_url: "https://www.amazon.co.jp",
    icon_url: null,
    note: null,
    sort_order: 2,
    created_at: "2026-01-02T00:00:00.000Z",
    aliases: [],
  },
];

const action: MerchantStateAction = async () => ({});

const meta = {
  title: "Templates/Merchants/MerchantsActionStateTemplate",
  component: MerchantsActionStateTemplate,
  args: {
    archiveMerchantAction: action,
    archiveMerchantAliasAction: action,
    createMerchantAction: action,
    createMerchantAliasAction: action,
    merchants,
    keyword: "",
    ledgerName: "家庭账本",
    updateMerchantAction: action,
  },
} satisfies Meta<typeof MerchantsActionStateTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "商家页面",
};

export const WithKeyword: Story = {
  name: "带搜索词",
  args: {
    keyword: "便利",
  },
};

export const Empty: Story = {
  name: "无商家",
  args: {
    merchants: [],
  },
};

export const CreateFailure: Story = {
  name: "新增商家失败",
  args: {
    createMerchantAction: async () => ({
      error: "商家新增失败。请确认商家名称是否重复，或稍后重试。",
      errorKey: "storybook-create-failed",
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nameInput = canvas.getAllByRole("textbox", {
      name: "商家名称",
    })[0];
    await userEvent.type(nameInput, "Storybook 失败商家");
    await userEvent.click(canvas.getByRole("button", { name: "新增商家" }));

    await within(document.body).findByRole("heading", {
      name: "商家新增失败",
    });
    await expect(nameInput).toHaveValue("Storybook 失败商家");
  },
};

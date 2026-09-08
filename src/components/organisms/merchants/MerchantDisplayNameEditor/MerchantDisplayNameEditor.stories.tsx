import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { useState } from "react";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";
import { designTokens } from "theme/theme";

import { MerchantDisplayNameEditor } from "./MerchantDisplayNameEditor";

const meta = {
  title: "Organisms/Merchants/MerchantDisplayNameEditor",
  component: MerchantDisplayNameEditor,
  args: {
    archiveAliasAction: async () => {},
    createAliasAction: async () => {},
    merchant: createMerchantRow({
      aliases: [
        createMerchantAliasRow({ alias: "晨光生活", is_preferred: true }),
        createMerchantAliasRow({ alias: "晨光", id: "alias-2" }),
      ],
      display_name: "晨光生活",
      name: "晨光生活超市有限公司",
    }),
    setPreferredAliasAction: async () => {},
  },
} satisfies Meta<typeof MerchantDisplayNameEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "显示名与别名管理",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nameButton = canvas.getByRole("button", {
      name: "将晨光设为展示名",
    });
    const nameRow = nameButton.closest("form")?.parentElement;
    const aliasInput = canvas.getByRole("textbox", { name: "别名" });
    const inputRoot = aliasInput.closest(".MuiOutlinedInput-root");
    const addButton = canvas.getByRole("button", { name: "添加别名" });

    await expect(nameRow).not.toBeNull();
    await expect(inputRoot).not.toBeNull();
    await expect(inputRoot!.getBoundingClientRect().left).toBe(
      nameRow!.getBoundingClientRect().left,
    );
    await expect(
      aliasInput.getBoundingClientRect().left +
        Number.parseFloat(getComputedStyle(aliasInput).paddingLeft),
    ).toBe(nameButton.querySelector("span")!.getBoundingClientRect().left);
    await expect(getComputedStyle(inputRoot!).borderRadius).toBe(
      `${designTokens.radius.item}px`,
    );
    await expect(getComputedStyle(addButton).borderRadius).toBe(
      `${designTokens.radius.item}px`,
    );
  },
};

export const FormalNameSelected: Story = {
  name: "正式名为当前展示名",
  args: {
    merchant: createMerchantRow({
      aliases: [],
      display_name: "晨光生活超市有限公司",
      name: "晨光生活超市有限公司",
    }),
  },
};

export const Interactive: Story = {
  name: "点击名称切换显示名",
  render: function InteractiveNames(args) {
    const [merchant, setMerchant] = useState(args.merchant);
    return (
      <MerchantDisplayNameEditor
        {...args}
        merchant={merchant}
        setPreferredAliasAction={async (data) => {
          const aliasId = data.get("aliasId");
          setMerchant((current) => ({
            ...current,
            display_name:
              current.aliases.find((alias) => alias.id === aliasId)?.alias ??
              current.name,
            aliases: current.aliases.map((alias) => ({
              ...alias,
              is_preferred: alias.id === aliasId,
            })),
          }));
        }}
      />
    );
  },
};

export const Pending: Story = { name: "切换处理中", args: { pending: true } };

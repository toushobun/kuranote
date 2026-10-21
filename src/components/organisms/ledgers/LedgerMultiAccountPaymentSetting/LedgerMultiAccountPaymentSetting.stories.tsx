import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, within } from "storybook/test";

import { ledgerFeatureSettingMessages } from "config/ledgerMessages";

import { LedgerMultiAccountPaymentSetting } from "./LedgerMultiAccountPaymentSetting";

function InteractivePreview() {
  const [enabled, setEnabled] = useState(false);
  return (
    <LedgerMultiAccountPaymentSetting enabled={enabled} onChange={setEnabled} />
  );
}

const meta = {
  title: "Organisms/Ledgers/LedgerMultiAccountPaymentSetting",
  component: LedgerMultiAccountPaymentSetting,
  args: { enabled: true, onChange: () => undefined },
} satisfies Meta<typeof LedgerMultiAccountPaymentSetting>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  name: "可交互启停",
  render: () => <InteractivePreview />,
};

export const Enabled: Story = {
  name: "开启（关闭限制说明）",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(
        ledgerFeatureSettingMessages.multiAccountPayment.enabledDescription,
      ),
    ).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  name: "关闭",
  args: { enabled: false },
};

export const WithoutEnabledDescription: Story = {
  name: "不显示关闭限制说明（创建账本向导）",
  args: { enabledDescription: null },
};

export const MemberReadonly: Story = {
  name: "普通成员只读",
  args: { canEdit: false },
};

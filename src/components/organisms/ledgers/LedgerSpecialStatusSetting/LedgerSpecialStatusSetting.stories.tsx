import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { LedgerSpecialStatusSetting } from "./LedgerSpecialStatusSetting";

function InteractivePreview() {
  const [enabled, setEnabled] = useState(true);
  return <LedgerSpecialStatusSetting enabled={enabled} onChange={setEnabled} />;
}

const meta = {
  title: "Organisms/Ledgers/LedgerSpecialStatusSetting",
  component: LedgerSpecialStatusSetting,
  args: { enabled: true, onChange: () => undefined },
} satisfies Meta<typeof LedgerSpecialStatusSetting>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  name: "可交互启停",
  render: () => <InteractivePreview />,
};

export const Disabled: Story = {
  name: "关闭状态",
  args: { enabled: false },
};

export const MemberReadonly: Story = {
  name: "普通成员只读",
  args: { canEdit: false },
};

export const Loading: Story = {
  name: "加载状态",
  args: { state: "loading" },
};

export const Error: Story = {
  name: "错误状态",
  args: { onRetry: () => undefined, state: "error" },
};

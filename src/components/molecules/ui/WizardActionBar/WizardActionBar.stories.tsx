import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UserThemeProvider } from "theme/UserThemeProvider";

import { WizardActionBar } from "./WizardActionBar";

const meta = {
  title: "Molecules/UI/WizardActionBar",
  component: WizardActionBar,
  decorators: [
    (Story) => (
      <UserThemeProvider>
        <div style={{ maxWidth: 420 }}>
          <Story />
        </div>
      </UserThemeProvider>
    ),
  ],
  args: {
    next: { label: "下一步", onClick: () => {} },
  },
} satisfies Meta<typeof WizardActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NextOnly: Story = {
  name: "只有下一步（第 1 步）",
};

export const PreviousAndNext: Story = {
  name: "上一步 + 下一步",
  args: {
    previous: { label: "上一步", onClick: () => {} },
  },
};

export const WithSkip: Story = {
  name: "带跳过此步",
  args: {
    previous: { label: "上一步", onClick: () => {} },
    skip: { label: "跳过此步", onClick: () => {} },
  },
};

export const Loading: Story = {
  name: "处理中",
  args: {
    next: { label: "下一步", loading: true, loadingLabel: "保存中" },
    previous: { disabled: true, label: "上一步", onClick: () => {} },
  },
};

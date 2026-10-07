import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { ledgerSetupTemplateFixture } from "test/mocks/ledgerSetup";
import { UserThemeProvider } from "theme/UserThemeProvider";

import { LedgerSetupAccountAddSheet } from "./LedgerSetupAccountAddSheet";

const meta = {
  title: "Organisms/Ledgers/LedgerSetupAccountAddSheet",
  component: LedgerSetupAccountAddSheet,
  decorators: [
    (Story) => (
      <UserThemeProvider>
        <Story />
      </UserThemeProvider>
    ),
  ],
  args: {
    accounts: [
      { name: "现金", type: "cash" },
      { name: "楽天銀行", templateKey: "楽天銀行", type: "bank" },
    ],
    candidates: ledgerSetupTemplateFixture.accountCandidates.bank,
    onAdd: () => {},
    onClose: () => {},
    open: true,
    type: "bank",
  },
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof LedgerSetupAccountAddSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCandidates: Story = {
  name: "有候选（已添加的显示 ✓）",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("button", { name: "三菱UFJ銀行" }),
    );
  },
};

export const WithoutCandidates: Story = {
  name: "无候选（现金 / 无模板币种）",
  args: { candidates: [] },
};

export const DuplicateName: Story = {
  name: "重名错误",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("button", { name: "楽天銀行 已添加" }),
    );
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ledgerCreateErrorCodes,
  ledgerCreateErrorMessages,
} from "internal/ledger";
import { UserThemeProvider } from "theme/UserThemeProvider";

import { LedgerCreateTemplate } from "./LedgerCreate";

const meta = {
  title: "Templates/Ledgers/LedgerCreateTemplate",
  component: LedgerCreateTemplate,
  decorators: [
    (Story) => (
      <UserThemeProvider>
        <Story />
      </UserThemeProvider>
    ),
  ],
  args: {
    backHref: "/ledgers",
    createLedgerAction: async (state) => state,
    defaults: {
      baseCurrency: "JPY",
      displayColor: "amber",
      displayName: "DENG SONGWEN",
      ledgerName: "家庭账本",
    },
  },
} satisfies Meta<typeof LedgerCreateTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "账本创建页",
};

export const CreateFailed: Story = {
  name: "提交后创建失败",
  args: {
    createLedgerAction: async () => ({
      error: ledgerCreateErrorMessages[ledgerCreateErrorCodes.createFailed],
      errorKey: "storybook-error",
    }),
  },
};

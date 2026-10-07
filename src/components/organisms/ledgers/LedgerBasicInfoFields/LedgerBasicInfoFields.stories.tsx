import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { UserThemeProvider } from "theme/UserThemeProvider";

import {
  LedgerBasicInfoFields,
  type LedgerBasicInfoValues,
} from "./LedgerBasicInfoFields";

const meta = {
  title: "Organisms/Ledgers/LedgerBasicInfoFields",
  component: LedgerBasicInfoFields,
  decorators: [
    (Story) => (
      <UserThemeProvider>
        <Story />
      </UserThemeProvider>
    ),
  ],
  args: {
    onChange: () => {},
    values: {
      baseCurrency: "JPY",
      displayColor: "amber",
      displayName: "DENG SONGWEN",
      ledgerName: "家庭账本",
    },
  },
  render: function Render({ values: initialValues }) {
    const [values, setValues] = useState<LedgerBasicInfoValues>(initialValues);

    return <LedgerBasicInfoFields onChange={setValues} values={values} />;
  },
} satisfies Meta<typeof LedgerBasicInfoFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "默认值",
};

export const OtherColor: Story = {
  name: "已选择其他个性色",
  args: {
    values: {
      baseCurrency: "USD",
      displayColor: "sky",
      displayName: "旅人",
      ledgerName: "旅行账本",
    },
  },
};

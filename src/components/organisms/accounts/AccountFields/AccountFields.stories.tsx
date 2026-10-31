import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AccountFields } from "./AccountFields";

function AccountFieldsPreview() {
  return (
    <Stack component="form" spacing={2} sx={{ maxWidth: 520 }}>
      <AccountFields
        balanceLabel="初始金额"
        defaultCurrency="JPY"
        defaultType="cash"
        holderOptions={[
          {
            user_id: "00000000-0000-4000-8000-000000000001",
            display_color: "sky" as const,
            display_name: "淞文",
            email: "songwen@example.com",
          },
          {
            user_id: "00000000-0000-4000-8000-000000000002",
            display_color: "sakura" as const,
            display_name: "秋爽",
            email: "qiushuang@example.com",
          },
        ]}
        nameId="storybook-account-name"
        renderBalanceField={(currency) => (
          <TextField
            fullWidth
            value={`0 ${currency}`}
            slotProps={{ htmlInput: { "aria-label": "初始余额" } }}
          />
        )}
      />
    </Stack>
  );
}

const meta = {
  title: "Organisms/Accounts/AccountFields",
  component: AccountFieldsPreview,
} satisfies Meta<typeof AccountFieldsPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

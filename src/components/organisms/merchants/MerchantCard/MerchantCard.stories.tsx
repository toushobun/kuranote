import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { ThemeProvider } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { CSSProperties } from "react";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";
import { createDynamicMuiTheme } from "providers/DynamicMuiThemeProvider";
import { getUserThemeCssVariables } from "theme/userThemeCssVariables";
import { userThemeKeys, userThemeTokens } from "theme/userThemeTokens";

import { SortableList } from "molecules/ui/SortableList/SortableList";
import { SortableItem } from "molecules/ui/SortableList/SortableItem";
import { MerchantCard } from "./MerchantCard";

const merchant = createMerchantRow({
  aliases: [
    createMerchantAliasRow({ is_preferred: true }),
    createMerchantAliasRow({ alias: "LIFE", id: "alias-2", sort_order: 2 }),
  ],
  display_name: "来福",
  note: "常去的超市",
  tags: [
    {
      icon: "🛒",
      id: "tag-supermarket",
      merchant_count: 1,
      name: "超市",
      sort_order: 1,
    },
    {
      icon: "🧴",
      id: "tag-daily",
      merchant_count: 1,
      name: "日用",
      sort_order: 2,
    },
    {
      icon: "🛋️",
      id: "tag-home",
      merchant_count: 1,
      name: "家居",
      sort_order: 3,
    },
  ],
});

function MerchantCardThemePreview() {
  return (
    <Stack spacing={1.5}>
      {userThemeKeys.map((themeKey) => {
        const token = userThemeTokens[themeKey];

        return (
          <ThemeProvider key={themeKey} theme={createDynamicMuiTheme(themeKey)}>
            <Box
              style={getUserThemeCssVariables(themeKey) as CSSProperties}
              sx={{
                bgcolor: "background.default",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                p: 2,
              }}
            >
              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 700 }}>{token.name}</Typography>
                <MerchantCard
                  editHref="/merchants/merchant-1/edit"
                  ledgerId="ledger-1"
                  merchant={merchant}
                  setPreferredAliasAction={async () => {}}
                />
              </Stack>
            </Box>
          </ThemeProvider>
        );
      })}
    </Stack>
  );
}

const meta = {
  title: "Organisms/Merchants/MerchantCard",
  component: MerchantCard,
  args: {
    setPreferredAliasAction: async () => {},
    editHref: "/merchants/merchant-1/edit",
    ledgerId: "ledger-1",
    merchant,
  },
} satisfies Meta<typeof MerchantCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "正式名身份与首选别名",
};

export const WithoutAliases: Story = {
  name: "无别名",
  args: {
    editHref: "/merchants/merchant-1/edit",
    ledgerId: "ledger-1",
    merchant: createMerchantRow({ aliases: [] }),
  },
};

export const MultipleThemes: Story = {
  name: "全部个人主题对比",
  render: () => <MerchantCardThemePreview />,
};

export const Interactive: Story = {
  name: "点击名称切换显示名",
  render: function InteractiveNames(args) {
    const [merchant, setMerchant] = useState(args.merchant);
    return (
      <MerchantCard
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

export const FormalNameSelected: Story = {
  name: "正式名身份与当前显示名同时标记",
  args: {
    merchant: {
      ...merchant,
      display_name: merchant.name,
      aliases: merchant.aliases.map((alias) => ({
        ...alias,
        is_preferred: false,
      })),
    },
  },
};
export const ReadOnly: Story = {
  name: "只读成员",
  args: { canManageMerchants: false },
};

export const Sortable: Story = {
  name: "常驻手柄与拖拽排序",
  render: function SortableCards(args) {
    const [merchants, setMerchants] = useState([
      args.merchant,
      createMerchantRow({ id: "merchant-2", name: "便利店" }),
    ]);
    return (
      <SortableList
        items={merchants.map((item) => item.id)}
        onReorder={(ids) =>
          setMerchants(
            ids.flatMap((id) => merchants.find((item) => item.id === id) ?? []),
          )
        }
      >
        <Stack spacing={1} sx={{ maxWidth: 480 }}>
          {merchants.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {(handleProps) => (
                <MerchantCard
                  {...args}
                  merchant={item}
                  handleProps={handleProps}
                />
              )}
            </SortableItem>
          ))}
        </Stack>
      </SortableList>
    );
  },
};
export const SortingDisabled: Story = {
  name: "筛选或保存期间禁用排序",
  args: { handleProps: { disabled: true } },
};

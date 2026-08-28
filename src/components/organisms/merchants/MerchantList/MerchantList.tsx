import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Link from "next/link";

import { merchantEditHref } from "config/paths";
import { EmptyState } from "molecules/ui/EmptyState";
import type { Merchant } from "types/merchants";

import { MerchantCard } from "../MerchantCard/MerchantCard";

type MerchantListProps = {
  canManageMerchants?: boolean;
  createHref: string;
  keyword?: string;
  ledgerId: string;
  merchants: Merchant[];
};

export function MerchantList({
  canManageMerchants = true,
  createHref,
  keyword = "",
  ledgerId,
  merchants,
}: MerchantListProps) {
  const isSearchEmpty = keyword.trim().length > 0 && merchants.length === 0;

  if (merchants.length === 0) {
    return (
      <EmptyState
        action={
          canManageMerchants && !isSearchEmpty ? (
            <Button component={Link} href={createHref} variant="contained">
              添加第一个商家
            </Button>
          ) : null
        }
        description={
          isSearchEmpty
            ? `没有找到与“${keyword.trim()}”匹配的正式名或别名。`
            : canManageMerchants
              ? "添加常用商家，让记账和搜索更快捷。"
              : "当前账本还没有可查看的商家。"
        }
        illustration={
          <StorefrontRoundedIcon
            sx={{ color: "var(--user-theme-icon-badge-color)", fontSize: 72 }}
          />
        }
        title={isSearchEmpty ? "没有找到匹配的商家" : "还没有商家"}
      />
    );
  }

  return (
    <Stack spacing={2}>
      {merchants.map((merchant) => (
        <MerchantCard
          canManageMerchants={canManageMerchants}
          editHref={merchantEditHref(merchant.id)}
          key={merchant.id}
          ledgerId={ledgerId}
          merchant={merchant}
        />
      ))}
    </Stack>
  );
}

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { merchantEditHref } from "config/paths";
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
      <Stack
        spacing={1.5}
        sx={{
          alignItems: "center",
          px: 2,
          py: { xs: 6, sm: 8 },
          textAlign: "center",
        }}
      >
        <Box
          alt={
            isSearchEmpty
              ? "拿着放大镜寻找商家的猫咪"
              : "橙色遮阳棚的小店和门口的猫咪"
          }
          component="img"
          src={
            isSearchEmpty
              ? "/assets/kura-search/search_illustration_amber_warmth.png"
              : "/assets/kura-merchant-empty/merchant_empty_amber_warmth.png"
          }
          sx={{
            height: "auto",
            maxWidth: "100%",
            mb: 1,
            width: { xs: 320, sm: 360 },
          }}
        />
        <Typography component="h2" variant="h5" sx={{ fontWeight: 900 }}>
          {isSearchEmpty ? "没有找到匹配的商家" : "还没有商家"}
        </Typography>
        <Typography color="text.secondary">
          {isSearchEmpty
            ? `没有找到与“${keyword.trim()}”匹配的正式名或别名。`
            : canManageMerchants
              ? "添加常用商家，记账更快捷～"
              : "当前账本还没有可查看的商家。"}
        </Typography>
        {canManageMerchants && !isSearchEmpty ? (
          <Button
            component={Link}
            href={createHref}
            size="large"
            sx={{
              borderRadius: 999,
              minHeight: 48,
              minWidth: { xs: 240, sm: 280 },
              mt: 1,
            }}
            variant="contained"
          >
            添加第一个商家
          </Button>
        ) : null}
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5}>
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

import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
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
        spacing={1.25}
        sx={{
          alignItems: "center",
          px: 2,
          py: { xs: 6, sm: 8 },
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            alignItems: "center",
            background: "linear-gradient(145deg, #fff7dc, #fff0c2)",
            borderRadius: "50%",
            display: "flex",
            height: { xs: 156, sm: 184 },
            justifyContent: "center",
            mb: 1,
            width: { xs: 156, sm: 184 },
          }}
        >
          <StorefrontRoundedIcon
            sx={{ color: "primary.main", fontSize: { xs: 92, sm: 112 } }}
          />
        </Box>
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
            sx={{ borderRadius: 999, mt: 1, minWidth: { xs: 240, sm: 280 } }}
            variant="contained"
          >
            添加第一个商家
          </Button>
        ) : null}
      </Stack>
    );
  }

  return (
    <Stack spacing={1.25}>
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

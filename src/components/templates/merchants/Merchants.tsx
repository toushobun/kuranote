import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Link from "next/link";

import { routePaths } from "config/paths";
import { SectionCard } from "molecules/ui/SectionCard";
import { MerchantList } from "organisms/merchants/MerchantList/MerchantList";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";
import type { Merchant } from "types/merchants";

export type MerchantsTemplateProps = {
  canManageMerchants?: boolean;
  keyword: string;
  ledgerId: string;
  ledgerName: string;
  merchants: Merchant[];
};

export function MerchantsTemplate({
  canManageMerchants = true,
  keyword,
  ledgerId,
  ledgerName,
  merchants,
}: MerchantsTemplateProps) {
  const hasMerchants = merchants.length > 0;
  const hasKeyword = keyword.trim().length > 0;

  return (
    <PageShell>
      <PageHeader
        action={
          canManageMerchants ? (
            <Button
              component={Link}
              href={routePaths.merchantsNew}
              startIcon={<AddRoundedIcon />}
              variant="contained"
            >
              新增商家
            </Button>
          ) : null
        }
        subtitle={`当前账本：${ledgerName}`}
        title="商家管理"
      />

      {hasMerchants || hasKeyword ? (
        <SectionCard component="form" sx={{ p: 2.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              defaultValue={keyword}
              fullWidth
              name="q"
              placeholder="搜索正式名或别名"
              size="small"
              slotProps={{
                htmlInput: { "aria-label": "搜索商家" },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button type="submit" variant="outlined">
              搜索
            </Button>
          </Stack>
        </SectionCard>
      ) : null}

      <MerchantList
        canManageMerchants={canManageMerchants}
        createHref={routePaths.merchantsNew}
        keyword={keyword}
        ledgerId={ledgerId}
        merchants={merchants}
      />
    </PageShell>
  );
}
